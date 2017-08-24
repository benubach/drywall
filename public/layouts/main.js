$(document).ready(function() {
	$('#deleteEvent').on('click', function(e) {
		let deleteId = $("#deleteEvent").data('delete');
		if(!deleteId)
			return;
		$.ajax({
			url: `/events/${deleteId}`,
			type: 'DELETE',
			success: function (result) {
				console.log(result);
				window.location = '/events';
			}
		})
	});
});