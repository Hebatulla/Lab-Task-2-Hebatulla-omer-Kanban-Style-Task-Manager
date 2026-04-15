

/** Master array */
let tasks = [];

/** Auto-incrementing ID counter. */
let nextId = 1;


let activeColumn = null;


let editingTaskId = null;

/* Column list elements — used for event delegation. */
const todoList        = document.getElementById('todoList');
const inprogressList  = document.getElementById('inprogressList');
const doneList        = document.getElementById('doneList');

/* Header counter */
const taskCounter     = document.getElementById('taskCounter');

/* Per-column count badges */
const todoCount       = document.getElementById('todoCount');
const inprogressCount = document.getElementById('inprogressCount');
const doneCount       = document.getElementById('doneCount');

/* Modal elements */
const modalOverlay    = document.getElementById('modalOverlay');
const modalTitle      = document.getElementById('modalTitle');
const modalSave       = document.getElementById('modalSave');
const modalCancel     = document.getElementById('modalCancel');
const taskTitleInput  = document.getElementById('taskTitle');
const taskDescInput   = document.getElementById('taskDesc');
const taskPriorityInput = document.getElementById('taskPriority');
const taskDueInput    = document.getElementById('taskDue');

/* Priority filter dropdown */
const priorityFilter  = document.getElementById('priorityFilter');

/* Clear Done button */
const clearDoneBtn    = document.getElementById('clearDoneBtn');


/* ============================================================
    TASK 2
   ============================================================ */

/**

 * innerHTML is NOT used anywhere in this function.
 * @param {Object} taskObj - { id, title, desc, priority, due }
 * @returns {HTMLLIElement}
 */
function createTaskCard(taskObj) {
  
  const li = document.createElement('li');
  li.setAttribute('class', 'task-card');
  li.setAttribute('data-id', taskObj.id);
  li.setAttribute('data-priority', taskObj.priority);

  const titleSpan = document.createElement('span');
  titleSpan.setAttribute('class', 'task-title');
  titleSpan.textContent = taskObj.title;
  titleSpan.setAttribute('title', 'Double-click to rename');
  li.appendChild(titleSpan);

  /* --- Description <p> --- */
  const descP = document.createElement('p');
  descP.setAttribute('class', 'task-desc');
  descP.textContent = taskObj.desc || '';
  li.appendChild(descP);

  const metaDiv = document.createElement('div');
  metaDiv.setAttribute('class', 'task-meta');

  
  const badge = document.createElement('span');
  badge.setAttribute('class', 'priority-badge ' + taskObj.priority);
  const priorityLabels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  badge.textContent = priorityLabels[taskObj.priority] || taskObj.priority;
  metaDiv.appendChild(badge);

  
  if (taskObj.due) {
    const dueSpan = document.createElement('span');
    dueSpan.setAttribute('class', 'due-date');
    dueSpan.textContent = '📅 ' + taskObj.due;
    metaDiv.appendChild(dueSpan);
  }

  li.appendChild(metaDiv);

  const actionsDiv = document.createElement('div');
  actionsDiv.setAttribute('class', 'card-actions');

  // Edit buttonn
  const editBtn = document.createElement('button');
  editBtn.setAttribute('class', 'btn-edit');
  editBtn.setAttribute('data-action', 'edit');
  editBtn.setAttribute('data-id', taskObj.id);
  editBtn.textContent = 'Edit';
  actionsDiv.appendChild(editBtn);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.setAttribute('class', 'btn-delete');
  deleteBtn.setAttribute('data-action', 'delete');
  deleteBtn.setAttribute('data-id', taskObj.id);
  deleteBtn.textContent = 'Delete';
  actionsDiv.appendChild(deleteBtn);

  li.appendChild(actionsDiv);

  return li;
}

/**
 * 
 *
 * @param {string} columnId - 
 * @param {Object} taskObj  
 */
function addTask(columnId, taskObj) {
  // Determine target list
  const listEl = getListByColumn(columnId);
  if (!listEl) return;

  // Store in state
  tasks.push(taskObj);

  // Build and insert the card
  const card = createTaskCard(taskObj);
  listEl.appendChild(card);

  // Refresh header counter and column badge
  updateCounters();
}

/**
 * @param {number} taskId
 */
function deleteTask(taskId) {
  const card = document.querySelector('.task-card[data-id="' + taskId + '"]');
  if (!card) return;

  
  card.classList.add('fade-out');
  card.addEventListener('animationend', function onEnd() {
    card.removeEventListener('animationend', onEnd);
    card.remove();

    // Remove from state array
    tasks = tasks.filter(function(t) { return t.id !== taskId; });
    updateCounters();
  });
}

/**
 * @param {number} taskId
 */
function editTask(taskId) {
  const task = tasks.find(function(t) { return t.id === taskId; });
  if (!task) return;

  editingTaskId = taskId;
  activeColumn = null;

  // Pre-fill modal fields
  modalTitle.textContent   = 'Edit Task';
  taskTitleInput.value     = task.title;
  taskDescInput.value      = task.desc || '';
  taskPriorityInput.value  = task.priority;
  taskDueInput.value       = task.due || '';

  openModal();
}

/**
 *
 *
 * @param {number} taskId
 * @param {Object} updatedData - { title, desc, priority, due }
 */
function updateTask(taskId, updatedData) {
  // Find and update state
  const taskIndex = tasks.findIndex(function(t) { return t.id === taskId; });
  if (taskIndex === -1) return;

  // Merge updated fields into the stored object
  tasks[taskIndex].title    = updatedData.title;
  tasks[taskIndex].desc     = updatedData.desc;
  tasks[taskIndex].priority = updatedData.priority;
  tasks[taskIndex].due      = updatedData.due;

  const updatedTask = tasks[taskIndex];

  // Find the existing card in the DOM
  const oldCard = document.querySelector('.task-card[data-id="' + taskId + '"]');
  if (!oldCard) return;

  // Build a fresh card and swap it in (keeps column position)
  const newCard = createTaskCard(updatedTask);
  oldCard.replaceWith(newCard);

  updateCounters();
}


/* 
   3. EVENT HANDLING — TASK 3
   ============================================================ */


function attachColumnListeners(listEl) {
  listEl.addEventListener('click', function(event) {
    const action = event.target.getAttribute('data-action'); // 'edit' or 'delete'
    const idStr  = event.target.getAttribute('data-id');
    if (!action || !idStr) return; // click on non-button area — ignore

    const taskId = parseInt(idStr, 10);

    if (action === 'delete') { deleteTask(taskId); }
    if (action === 'edit')   { editTask(taskId);   }
  });

  // Inline editing: listen for dblclick on the list, check if target is a title
  listEl.addEventListener('dblclick', function(event) {
    if (!event.target.classList.contains('task-title')) return;
    startInlineEdit(event.target);
  });
}

/**
 
 * @param {HTMLSpanElement} titleSpan
 */
function startInlineEdit(titleSpan) {
  // Prevent multiple simultaneous edits
  if (titleSpan.querySelector('input')) return;

  const card   = titleSpan.closest('.task-card');
  const taskId = parseInt(card.getAttribute('data-id'), 10);

  const input = document.createElement('input');
  input.setAttribute('class', 'title-edit-input');
  input.setAttribute('type', 'text');
  input.value = titleSpan.textContent;

  titleSpan.textContent = '';
  titleSpan.appendChild(input);
  input.focus();
  input.select();

  function commitInlineEdit() {
    const newTitle = input.value.trim() || titleSpan.textContent;

    // Update state
    const task = tasks.find(function(t) { return t.id === taskId; });
    if (task && input.value.trim()) {
      task.title = input.value.trim();
    }

    // Restore the span
    titleSpan.textContent = task ? task.title : input.value.trim();
  }

  // Commit on Enter key
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitInlineEdit();
      input.blur();
    }
    // Escape cancels (restores old title)
    if (e.key === 'Escape') {
      const task = tasks.find(function(t) { return t.id === taskId; });
      titleSpan.textContent = task ? task.title : '';
    }
  });

  // Commit on blur (clicking away)
  input.addEventListener('blur', commitInlineEdit);
}

priorityFilter.addEventListener('change', function() {
  const selected = priorityFilter.value; // 'all' | 'high' | 'medium' | 'low'

  const allCards = document.querySelectorAll('.task-card');
  allCards.forEach(function(card) {
    const cardPriority = card.getAttribute('data-priority');
    // is-hidden is applied when priorities don't match (and filter isn't 'all')
    const shouldHide = selected !== 'all' && cardPriority !== selected;
    card.classList.toggle('is-hidden', shouldHide);
  });
});

clearDoneBtn.addEventListener('click', function() {
  const doneCards = Array.from(doneList.querySelectorAll('.task-card'));
  if (doneCards.length === 0) return;

  doneCards.forEach(function(card, index) {
    
    setTimeout(function() {
      card.classList.add('fade-out');
      card.addEventListener('animationend', function onEnd() {
        card.removeEventListener('animationend', onEnd);

        const taskId = parseInt(card.getAttribute('data-id'), 10);
        card.remove();
        tasks = tasks.filter(function(t) { return t.id !== taskId; });
        updateCounters();
      });
    }, index * 100);
  });
});


document.querySelectorAll('.add-task-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    activeColumn  = btn.getAttribute('data-column');
    editingTaskId = null; // creating a new task

    // Reset and label the modal for new task
    modalTitle.textContent  = 'New Task';
    taskTitleInput.value    = '';
    taskDescInput.value     = '';
    taskPriorityInput.value = 'medium';
    taskDueInput.value      = '';

    openModal();
  });
});


modalSave.addEventListener('click', function() {
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.focus();
    return; // Don't save without a title
  }

  const data = {
    title:    title,
    desc:     taskDescInput.value.trim(),
    priority: taskPriorityInput.value,
    due:      taskDueInput.value,
  };

  if (editingTaskId !== null) {
    // Editing existing task
    updateTask(editingTaskId, data);
  } else {
    // Creating new task
    data.id = nextId++;
    addTask(activeColumn, data);
  }

  closeModal();
});


modalCancel.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', function(event) {
  if (event.target === modalOverlay) { closeModal(); }
});


document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') { closeModal(); }
});



function openModal() {
  modalOverlay.classList.add('is-open');
  taskTitleInput.focus();
}


function closeModal() {
  modalOverlay.classList.remove('is-open');
  editingTaskId = null;
  activeColumn  = null;
}

/**
 * getListByColumn(columnId)
 * Returns the <ul> element for a given column id string.
 *
 * @param {string} columnId - 'todo' | 'inprogress' | 'done'
 * @returns {HTMLUListElement|null}
 */
function getListByColumn(columnId) {
  const map = {
    todo:       todoList,
    inprogress: inprogressList,
    done:       doneList,
  };
  return map[columnId] || null;
}


function updateCounters() {
  const todoCards       = todoList.querySelectorAll('.task-card').length;
  const inprogressCards = inprogressList.querySelectorAll('.task-card').length;
  const doneCards       = doneList.querySelectorAll('.task-card').length;
  const total           = todoCards + inprogressCards + doneCards;

  taskCounter.textContent    = total + (total === 1 ? ' task' : ' tasks');
  todoCount.textContent       = todoCards;
  inprogressCount.textContent = inprogressCards;
  doneCount.textContent       = doneCards;
}



function init() {
  attachColumnListeners(todoList);
  attachColumnListeners(inprogressList);
  attachColumnListeners(doneList);
  updateCounters();
}

// Kick everything off lol
init();
