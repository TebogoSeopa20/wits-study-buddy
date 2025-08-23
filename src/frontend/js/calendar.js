document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    editable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    dateClick: function (info) {
      const task = prompt('Enter a task for ' + info.dateStr);
      if (task) {
        calendar.addEvent({
          title: task,
          start: info.dateStr,
          allDay: true
        });
      }
    },
    eventClick: function (info) {
      if (confirm('Remove this task?')) {
        info.event.remove();
      }
    }
  });

  calendar.render();
});
