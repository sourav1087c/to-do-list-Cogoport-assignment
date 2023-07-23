const taskList = document.getElementById('taskList')
const taskInput = document.getElementById('taskInput')
const dueDateInput = document.getElementById('dueDate')
const dueTimeInput = document.getElementById('dueTime')
const priorityInput = document.getElementById('priority')
const categoryInput = document.getElementById('categoryInput')
const reminderInput = document.getElementById('reminder')
const searchInput = document.getElementById('searchInput')
const searchResults = document.getElementById('searchResults')
const expired = document.getElementById('expired')
const dueDateFromInput = document.getElementById('dueDateFrom')
const dueDateToInput = document.getElementById('dueDateTo')
const categoryFilterInput = document.getElementById('categoryFilter')
const priorityFilterInput = document.getElementById('priorityFilter')

// Check for existing tasks in local storage and display them
let tasks = JSON.parse(localStorage.getItem('tasks')) || []

function saveTasks() {
	localStorage.setItem('tasks', JSON.stringify(tasks))
}

// Add an array to store activity logs
let activityLogs = []

// Function to add an activity log
function addActivityLog(action, task, subtask) {
	const activity = {
		action: action,
		task: task,
		subtask: subtask,
		timestamp: new Date().toLocaleString(), // Add timestamp to the activity log
	}

	activityLogs.push(activity)
	renderActivityTimeline()
}

function addTask() {
	const taskText = taskInput.value.trim()
	const dueDate = dueDateInput.value
	const dueTime = dueTimeInput.value
	const priority = priorityInput.value
	const category = categoryInput.value.trim()
	const reminder = reminderInput.checked

	if (taskText === '' || category === '') return

	const newTask = {
		text: taskText,
		dueDate: dueDate,
		dueTime: dueTime,
		priority: priority,
		category: category,
		reminder: reminder, // New property to store the reminder status
		completed: false,
		subtasks: [], // New property to store subtasks
		id: Date.now().toString(), // Use timestamp as a unique ID
		tags: [],
	}

	tasks.push(newTask)
	saveTasks()
	renderTasks()

	taskInput.value = ''
	dueDateInput.value = ''
	dueTimeInput.value = ''
	priorityInput.value = 'medium' // Reset priority to default after adding a task
	categoryInput.value = '' // Reset category input after adding a task
	reminderInput.checked = false // Reset reminder checkbox after adding a task

	addActivityLog('Task Added', newTask.text)
	dateAutocomplete()
}

function dateAutocomplete() {
	// Get the due date text from the user
	const dueDateText = dueDateInput.value
	//console.log(dueDateText)
	// If the due date text is in the format "complete x by tomorrow"
	if (dueDateText.includes('by tomorrow')) {
		// Get the current date and add 1 day
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 1)

		// Set the due date text to the current date
		dueDateInput.value = dueDate
		dueDateInput.dispatchEvent(new Event('change'))
	} else if (dueDateText.includes('by')) {
		// Split the due date text into two parts: the task text and the due date
		const [taskText, dueDate] = dueDateText.split('by')

		// Parse the due date string into a Date object
		const parsedDueDate = new Date(dueDate)

		// Set the due date text to the parsed due date
		dueDateInput.value = parsedDueDate
		dueDateInput.dispatchEvent(new Event('change'))
	}
}

function allowDrop(event) {
	event.preventDefault()
}

function drag(event) {
	event.dataTransfer.setData('text/plain', event.target.id)
}

function drop(event) {
	event.preventDefault()
	const taskId = event.dataTransfer.getData('text/plain')
	const taskElement = document.getElementById(taskId)
	if (taskElement) {
		taskList.appendChild(taskElement)
	}
}

function showExpired() {
	let currentDate = new Date()
	let dd = String(currentDate.getDate()).padStart(2, '0')
	let mm = String(currentDate.getMonth() + 1).padStart(2, '0')
	let yyyy = currentDate.getFullYear()
	let hours = currentDate.getHours()
	let minutes = currentDate.getMinutes()

	currentDate = yyyy + '-' + mm + '-' + dd

	const tasksToRender = tasks.filter(e => {
		console.log(currentDate, e.dueDate)
		console.log(hours, minutes)
		console.log(e.dueTime, e.dueTime.slice(0, 2), e.dueTime.slice(3, 5))
		if (yyyy >= e.dueDate.slice(0, 4)) {
			console.log('y')
			if (mm >= e.dueDate.slice(5, 7)) {
				console.log('m')
				if (dd >= e.dueDate.slice(8, 10)) {
					console.log('d')
					if (hours >= e.dueTime.slice(0, 2)) {
						if (minutes >= e.dueTime.slice(3, 5)) {
							return true
						}
					}
				}
			}
		}

		return false
	})
	renderExpired(tasksToRender)
}

function renderExpired(tasksToRender) {
	// Clear the search results list
	expired.innerHTML = ''

	// Render the search results
	tasksToRender.forEach(task => {
		const li = createTaskElement(task)
		expired.appendChild(li)
	})
}

function addSubtask(taskId) {
	const subtaskInput = prompt('Enter a subtask:')
	if (subtaskInput === null || subtaskInput.trim() === '') return

	const task = tasks.find(task => task.id === taskId)
	if (!task) return

	const newSubtask = {
		text: subtaskInput.trim(),
		completed: false,
		id: Date.now().toString(),
	}

	task.subtasks.push(newSubtask)
	saveTasks()
	renderTasks()

	addActivityLog('Subtask Added', task.text, newSubtask.text)
}

function deleteTask(taskId) {
	tasks = tasks.filter(task => {
		if (task.id == taskId) {
			addActivityLog('Task Deleted', task.text, 0)
		}
		return task.id !== taskId
	})
	saveTasks()
	renderTasks()
}

function toggleComplete(taskId) {
	tasks = tasks.map(task => {
		if (task.id === taskId) {
			const action = task.completed ? 'Task Unchecked' : 'Task Checked'
			addActivityLog(action, task.text)
			return { ...task, completed: !task.completed }
		}
		return task
	})
	saveTasks()
	renderTasks()
}

function markAsDone(taskId) {
	tasks = tasks.map(task => {
		if (task.id === taskId) {
			return { ...task, completed: true }
		}
		return task
	})
	saveTasks()
	renderTasks()
}

function markAsUndone(taskId) {
	tasks = tasks.map(task => {
		if (task.id === taskId) {
			return { ...task, completed: false }
		}
		return task
	})
	saveTasks()
	renderTasks()
}

function renderTasks(tasksToRender) {
	taskList.innerHTML = ''
	;(tasksToRender || tasks).forEach(task => {
		const li = createTaskElement(task)
		const checked = li.querySelector('.checked')
		const unchecked = li.querySelector('.unchecked')

		checked.addEventListener('click', () => toggleComplete(task.id))
		unchecked.addEventListener('click', () => toggleComplete(task.id))
		taskList.appendChild(li)
	})
}

function addTag(taskId) {
	console.log(taskId)
	const tagName = prompt('Enter a tag name: ')

	const selectedTask = tasks.find(task => task.id == taskId)
	console.log(selectedTask)
	selectedTask.tags.push(tagName)

	saveTasks()
	renderTasks()
}

function deleteTag(taskId, tagIndex) {
	const selectedTask = tasks.find(task => task.id == taskId)

	console.log(selectedTask)

	selectedTask.tags?.splice(tagIndex, 1)

	saveTasks()
	renderTasks()
}

function createTaskElement(task) {
	const li = document.createElement('li')
	li.id = task.id
	li.draggable = true
	li.addEventListener('dragstart', drag)

	li.className = task.completed ? 'complete' : ''

	const subtaskList = document.createElement('ul')
	subtaskList.className = 'subtask-list'

	task.subtasks.forEach((subtask, index) => {
		const subtaskLi = document.createElement('li')
		subtaskLi.innerHTML = `
		<div class="title">
		<span contenteditable>${subtask.text}</span>
		</div>
		<div>
		<i class="fa-solid fa-pen-to-square edit" onclick="editSubtask('${task.id}', '${
			task.id + index
		}', '${index}',)"></i>
		<i class="fa-solid fa-trash delete" onclick="deleteSubtask('${
			task.id
		}', ${index})"></i>
		<button><i class="fa-regular fa-circle-check checked"></i><i class="fa-solid fa-circle-check unchecked"></i></button>
		<div>
		</div>`
		subtaskLi.className = subtask.completed ? 'complete subtask' : 'subtask'
		subtaskLi.id = task.id + index
		subtaskList.appendChild(subtaskLi)
		const markBtn1 = subtaskLi.querySelector('.checked')
		const markBtn2 = subtaskLi.querySelector('.unchecked')
		markBtn1.addEventListener('click', () =>
			toggleSubtaskComplete(task.id, subtask.id)
		)
		markBtn2.addEventListener('click', () =>
			toggleSubtaskComplete(task.id, subtask.id)
		)
	})

	li.innerHTML = `
		<div class="li-container">
		<div class="without-tags">
			<span class="${task.completed ? 'complete' : ''} title" contenteditable >${
		task.text
	}</span>
		<div>
		<div class="cat-container">
    <span class="category" contenteditable>${task.category}</span>
		</div>
		<div class="date">
    <span class="due-date">${task.dueDate}</span>
    <span class="due-time">${task.dueTime}</span>
		</div>
		<div class="pr-container">
    <span class="priority ${task.priority}" contenteditable>${
		task.priority
	}</span>
		</div>
		<i class="fa-solid fa-pen-to-square edit" onclick="editTask('${task.id}')"></i>
		<i class="fa-solid fa-trash delete" onclick="deleteTask('${task.id}')"></i>
		<i class="fa-solid fa-layer-group add-sub" onclick="addSubtask('${
			task.id
		}')"></i>
		<i class="fa-solid fa-circle-plus tag" onclick="addTag(${task.id})"></i>
		<button><i class="fa-regular fa-circle-check checked"></i><i class="fa-solid fa-circle-check unchecked"></i></button>
		<div>
		</div>
		</div>
  `

	li.appendChild(subtaskList)

	const liContainer = li.querySelector('.li-container')

	const tagDiv = document.createElement('div')
	tagDiv.className = 'tags'
	task.tags?.forEach((tag, index) => {
		tagDiv.innerHTML += `<span>${tag} <i class="fa-solid fa-xmark" onclick="deleteTag(${task.id}, ${index})"></i></span>`
	})

	liContainer.appendChild(tagDiv)

	if (task.reminder && task.priority === 'high') {
		const reminderLabel = document.createElement('span')
		reminderLabel.className = 'reminder'
		reminderLabel.textContent = '⏰ Reminder'
		li.appendChild(reminderLabel)
	}

	return li
}

function sortTasks(type, order) {
	console.log(type, order)
	console.log(tasks)

	if (type === 'alph') {
		if (order === 'asc') {
			tasks.sort((a, b) => {
				if (a.text < b.text) {
					return -1
				}
				if (a.text > b.text) {
					return 1
				}
				return 0
			})
		} else {
			tasks.sort((a, b) => {
				if (a.text > b.text) {
					return -1
				}
				if (a.text < b.text) {
					return 1
				}
				return 0
			})
		}
	} else {
		if (order === 'asc') {
			tasks.sort((a, b) => {
				if (
					(a.priority == 'low' &&
						(b.priority == 'medium' || b.priority == 'medium')) ||
					(a.priority == 'medium' && b.priority == 'high')
				) {
					return 1
				}
				if (
					(a.priority == 'high' &&
						(b.priority == 'medium' || b.priority == 'low')) ||
					(a.priority == 'medium' && b.priority == 'low')
				) {
					return -1
				}
				return 0
			})
		} else {
			tasks.sort((a, b) => {
				if (
					(a.priority == 'low' &&
						(b.priority == 'medium' || b.priority == 'medium')) ||
					(a.priority == 'medium' && b.priority == 'high')
				) {
					return -1
				}
				if (
					(a.priority == 'high' &&
						(b.priority == 'medium' || b.priority == 'low')) ||
					(a.priority == 'medium' && b.priority == 'low')
				) {
					return 11
				}
				return 0
			})
		}
	}

	saveTasks()
	renderTasks()
}

function toggleSubtaskComplete(taskId, subtaskId) {
	tasks.forEach(task => {
		if (task.id === taskId) {
			task.subtasks.forEach(subtask => {
				if (subtask.id === subtaskId) {
					const action = subtask.completed
						? 'Subtask Unchecked'
						: 'Subtask Checked'
					addActivityLog(action, task.text, subtask.text)
					subtask.completed = !subtask.completed
				}
			})
		}
	})

	saveTasks()
	renderTasks()
}

function editTask(taskId) {
	const li = document.getElementById(taskId)
	console.log(li)
	const title = li.querySelector('.title').innerText
	const priority = li.querySelector('.priority').innerText
	const category = li.querySelector('.category').innerText

	if (title !== null && priority !== null && category !== null) {
		tasks = tasks.map(task => {
			if (task.id === taskId) {
				addActivityLog('Task Edited', task.text, 0)
				return {
					...task,
					text: title,
					priority: priority,
					category: category,
				}
			}
			return task
		})
		saveTasks()
		renderTasks()
	}
}

function editSubtask(taskId, subtaskId, index) {
	const subLi = [...document.querySelectorAll('.subtask')]
	const li = subLi.find(e => e.id === subtaskId)
	const title = li.querySelector('.title').innerText

	const taskN = tasks.find(task => task.id === taskId)

	if (title !== null) {
		taskN.subtasks = taskN.subtasks.map((task, tIndex) => {
			if (tIndex == index) {
				addActivityLog('Subtask Edited', taskN.text, task.text)
				return {
					text: title,
				}
			}
			return task
		})
		saveTasks()
		renderTasks()
	}
}

function deleteSubtask(taskId, index) {
	const task = tasks.find(task => task.id === taskId)
	console.log(task)
	if (!task) return
	let subtaskId = 0
	task.subtasks = task.subtasks.filter((e, eIndex) => {
		if (eIndex == index) {
			console.log(eIndex, index)
			subtaskId = index
		}
		return eIndex != index
	})

	saveTasks()
	renderTasks()
	addActivityLog('Subtask Deleted', task.text, task.subtasks[subtaskId].text)
}

function renderSearchResults(tasksToRender) {
	// Clear the search results list
	searchResults.innerHTML = ''

	// Render the search results
	tasksToRender.forEach(task => {
		const li = createTaskElement(task)
		searchResults.appendChild(li)
	})
}

function searchTasks() {
	const searchTerm = searchInput.value.trim().toLowerCase()
	const filteredTasks = tasks.filter(task =>
		task.text.toLowerCase().includes(searchTerm)
	)
	renderSearchResults(filteredTasks)
}

function applyFilters() {
	const dueDateFrom = dueDateFromInput.value
	const dueDateTo = dueDateToInput.value
	const categoryFilter = categoryFilterInput.value
	const priorityFilter = priorityFilterInput.value

	const filteredTasks = tasks.filter(task => {
		const isDueDateMatched =
			(!dueDateFrom || task.dueDate >= dueDateFrom) &&
			(!dueDateTo || task.dueDate <= dueDateTo)

		const isCategoryMatched =
			categoryFilter === 'all' || task.category === categoryFilter
		const isPriorityMatched =
			priorityFilter === 'all' || task.priority === priorityFilter

		return isDueDateMatched && isCategoryMatched && isPriorityMatched
	})

	renderTasks(filteredTasks)
}

function resetFilters() {
	dueDateFromInput.value = ''
	dueDateToInput.value = ''
	categoryFilterInput.value = 'all'
	priorityFilterInput.value = 'all'
	renderTasks()
}

// Initial rendering of tasks
renderTasks()

function renderActivityTimeline() {
	// Get the activityTimeline div
	const activityTimeline = document.getElementById('activityTimeline')

	// Clear the existing activity timeline content
	activityTimeline.innerHTML = '<h2>Activity Timeline</h2>'

	// Render each activity log as a list item in the activity timeline
	activityLogs.forEach(activity => {
		const activityItem = document.createElement('li')
		activityItem.className = 'activity'
		activityItem.innerHTML += `<span>${activity.timestamp}: ${activity.action}</span>`

		if (activity.task) {
			activityItem.innerHTML += `<span> - Task: ${activity.task}</span>`
		}

		if (activity.subtask != 0) {
			activityItem.innerHTML += `<span> - Subtask: ${activity.subtask}</span>`
		}

		activityTimeline.appendChild(activityItem)
	})
}

// Call the renderActivityTimeline function to display the activity timeline on page load
renderActivityTimeline()

const applying = document.querySelector('.applying')
const iconDown = document.querySelector('.fa-caret-down')

const dropDown = document
	.querySelector('#drop-down')
	.addEventListener('click', () => {
		if (applying.style.display === 'none') {
			applying.style.display = 'flex'
			iconDown.style.transform = 'rotate(180deg)'
		} else {
			applying.style.display = 'none'
			iconDown.style.transform = 'rotate(0deg)'
		}
	})
