var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// adding a js function for upcoming task moment.js code functionality--feature/dates
var auditTask = function(taskEl) {
  var date = $(taskEl).find("span").text().trim();
  // convert to moment object at 5:00 pm
  var time = moment(date, "L").set("hour", 17);
  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <=2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// enable drag feature 
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event, ui) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event, ui) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
    console.log(event);
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
    console.log(event);
  },
  update: function() {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      tempArr.push({
       text: $(this)
        .find("p")
        .text()
        .trim(),
       date: $(this)
        .find("span")
        .text()
        .trim()
      });
    });
    
      // trim down list's ID to match object property
      var arrName = $(this)
      .attr("id")
      .replace("list-", "");

      // update array on tasks object and save
      tasks[arrName] = tempArr;
      saveTasks();
  },
  stop: function(event) {
    $(this).removeClass("dropover");
  }
});


// adding trash into a droppable
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
  // remove dragged element from dom
    ui.draggable.remove();
    $('.bottom-trash').removeClass("bottom-trash-active");

  },
  over: function(event, ui) {
    $('.bottom-trash').addClass("bottom-trash-active");
    console.log(ui);
  },
  out: function(event, ui) {
    $('.bottom-trash').removeClass("bottom-trash-active");
    console.log(ui);
  }
});

// datepicker modal 
$("#modalDueDate").datepicker({
  minDate: 0
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});
// task text will be inside the p elements we're targeting in our click listener
$(".list-group").on("click", "p", function() {
  // get the text of the p element
  var text = $(this)
    .text()
    .trim();
  
  // replace the p element witha new textarea
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);  

  // auto focus on new element
  textInput.trigger("focus");
});

// adding a new event listener so that <textarea> reverts back when it goes out of focus
$(".list-group").on("blur", "textarea", function() {
  // get the textarea's current value/text
  var text = $(this).val().trim();

  // get the parent ul's id attribute 
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-","");
  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element 
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace the textarea with p element
  $(this).replaceWith(taskP);
});

// adding an event listener to help edit due dates
// due date was clicked
$(".list-group").on("click", "span", function() {
  // get the current text
  var date = $(this)
  .text()
  .trim();
  
  // create new input element
  var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);
  
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function() {
      // when the calender is closed, force a "change" event on the `dateInput`
      $(this).trigger("change")
    }
  });
 
  // automatically bring up the calender
  dateInput.trigger("focus");
 
 });


// adding an event listener to save dates once changed
// value of the due date was changed
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this).val().trim();

  // get the parent ul's id attribute 
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
  
  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));

});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// setInterval funciton to refresh the auditTask without having to refresh
setInterval(function () {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);

// load tasks for the first time
loadTasks();


