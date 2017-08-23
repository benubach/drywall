'use strict';

exports.find = function(req, res, next) {

    req.query.name = req.query.name ? req.query.name : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.username) {
        filters.name = new RegExp('^.*?' + req.query.username + '.*$', 'i');
    }

    req.app.db.models.Event.pagedFind({
        filters: filters,
        keys: 'name username description',
        limit: req.query.limit,
        page: req.query.page,
        sort: req.query.sort
    }, function(err, results) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            res.header("Cache-Control", "no-cache, no-store, must-revalidate");
            results.filters = req.query;
            res.send(results);
        } else {
            results.filters = req.query;
            res.render('events/index', {
                data: results.data
            });
        }
    });

};

exports.read = function(req, res, next) {
    var _id = req.params._id;
    req.app.db.models.Event.findById({
        _id: _id
    }).exec(function(err, event) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            req.send(event);
        } else {
            res.render('events/details', {
                event: event
            });
        }


    });
};

exports.add = function(req, res) {
    if(!req.isAuthenticated()){
        req.flash("error", "You're not logged in");
        res.location("/events");
        res.redirect("/events");
    }
    res.render('events/add', {csrfToken: req.csrfToken()});
};

exports.create = function(req, res) {
    if(!req.isAuthenticated()){
        req.flash("error", "You're not logged in");
        res.location("/events");
        res.redirect("/events");
    }
    
    var workflow = req.app.utility.workflow(req, res);
    workflow.on('validate', function() {
        if(!req.body.name){
            workflow.outcome.errors.push('Please enter a name for the event');
            
            return workflow.emit('validationError');
        }
        workflow.emit('createEvent');
    });
    workflow.on('createEvent', function() {
        var event = {name: req.body.name,
                     description: req.body.description,
                     venue: req.body.venue, 
                     date: req.body.date, 
                     startTime: req.body.startTime, 
                     endTime: req.body.endTime,
                     username: req.user.username};
        req.app.db.models.Event.create(event , function(err, event) {
            if(err){
                return workflow.emit('exception', err);
            }

            workflow.outcome.record = event;
            req.flash("success", "Event Added");
            res.location("/events");
            res.redirect("/events");
        });
    });

    workflow.on('validationError', function() {
        req.flash("error", workflow.outcome.errors.join("<br>"));
        console.log(req.locals);
        res.location("/events/add");
        res.redirect("/events/add");
    });

    workflow.emit('validate');
};

exports.update = function(req, res) {
    if(!req.isAuthenticated()){
        req.flash("error", "You're not logged in");
        res.location("/events");
        res.redirect("/events");
    }
    
    var workflow = req.app.utility.workflow(req, res);
    workflow.on('validate', function() {
        if(!req.body.name){
            workflow.outcome.errors.push('Please enter a name for the event');
            
            return workflow.emit('validationError');
        }
        workflow.emit('updateEvent');
    });
    workflow.on('updateEvent', function() {
        var event = {name: req.body.name,
                     description: req.body.description,
                     venue: req.body.venue, 
                     date: req.body.date, 
                     startTime: req.body.startTime, 
                     endTime: req.body.endTime,
                     username: req.user.username};
        req.app.db.models.Event.findByIdAndUpdate(req.params._id, event, function(err, event) {
            if(err){
                return workflow.emit('exception', err);
            }

            workflow.outcome.record = event;
            req.flash("success", "Event Updated");
            res.location("/events/show/"+req.params._id);
            res.redirect("/events/show/"+req.params._id);
        });
    });

    workflow.on('validationError', function() {
        req.flash("error", workflow.outcome.errors.join("<br>"));
        console.log(req.locals);
        res.location("/events/add");
        res.redirect("/events/add");
    });

    workflow.emit('validate');
};

exports.edit = function(req, res, next) {
    var _id = req.params._id;
    req.app.db.models.Event.findById({
        _id: _id
    }).exec(function(err, event) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            req.send(event);
        } else {
            res.render('events/edit', {
                event,
                csrfToken: req.csrfToken()
            });
        }


    });
};
