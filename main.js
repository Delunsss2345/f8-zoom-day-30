const modal = document.getElementById('taskModal');
const addBtn = document.querySelector('.add-btn');
const closeBtn = document.querySelector('.close-button');
const cancelBtn = document.querySelector('.cancel-button');
const addTask = document.querySelector('.add-new-button');
const textBox = document.querySelectorAll('.input-group > input, textarea');
const form = document.getElementById('form');
const todoMain = document.querySelector('.task-grid');
const tabList = document.querySelectorAll('.tab-list .tab-button');
const search = document.querySelector('.search-input');
const backDrop = document.querySelector('.modal-backdrop');
const toggleButtons = [addBtn, closeBtn, cancelBtn];

let todoTasks = [];

backDrop.onclick = () => {
    modal.classList.toggle('show');
}

// URL của API server
const baseUrl = 'http://localhost:3000/todos';

// Hàm gọi API với fetch
const fetchApi = async (url, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(url, options);

        if (!res.ok) throw new Error('Lỗi từ server');
        return await res.json();
    } catch (err) {
        console.error(err);
        showToast('error', 'Lỗi kết nối máy chủ!');
        throw err;
    }
};

// Hàm tải tất cả task từ server
const loadTasks = async () => {
    try {
        const data = await fetchApi(baseUrl);
        if (data) {
            todoTasks = data;
            renderTask(todoTasks);
        }
    } catch (error) {
        showToast('error', 'Không thể tải danh sách task');
    }
};




// Hàm xử lý bật/tắt modal
const handleToggleModal = (btn) => {
    modal.classList.toggle('show');

    if (btn.classList.contains('add-btn')) {
        modal.querySelector('.modal-title').innerHTML = 'Thêm Task Mới';
        form.removeAttribute('data-editing-id'); // Xoá edit id 
        form.reset(); 
        textBox[0].focus(); // Chọn input đầu tiên
    } 
    else {
        form.reset();
    }
};

// Gán sự kiện click cho các nút toggle modal
toggleButtons.forEach(btn => {
    btn.onclick = () => handleToggleModal(btn);
});

// Hàm lọc và hiển thị task theo tab được chọn
const filterActive = (index) => {
    if (index === 0) {
        renderTask(todoTasks); // Hiển thị tất cả task
    } else if (index === 1) {
        const activeTasks = todoTasks.filter(todo => !todo.isCompleted);
        renderTask(activeTasks); // Hiển thị task chưa hoàn thành
    } else if (index === 2) {
        const completedTasks = todoTasks.filter(todo => todo.isCompleted);
        renderTask(completedTasks); // Hiển thị task đã hoàn thành
    }
}

// Hàm hiển thị thông báo toast
const showToast = (type, text) => {
    notie.alert({ type, text, time: 2 });
};

// Xử lý sự kiện click trên các tab
tabList.forEach((tab, index) => {
    tab.onclick = () => {
        tabList.forEach(t => t.classList.remove("active")); // Tắt active tất cả tab
        tab.classList.add("active"); 
        filterActive(index); // Lọc task theo tab được chọn
    }
})

// Xử lý tìm kiếm task
search.addEventListener("input", function () {
    const key = this.value.trim().toLowerCase();

    // Reset về tab "All Task" khi tìm kiếm
    tabList.forEach(t => t.classList.remove("active"));
    tabList[0].classList.add("active");

    if (key === "") {
        renderTask(todoTasks); 
        return;
    }

    // Lọc task theo từ khóa tìm kiếm
    const filterTasks = todoTasks.filter(task =>
        task.title.toLowerCase().includes(key) ||
        task.description.toLowerCase().includes(key)
    );

    if (filterTasks.length > 0) {
        renderTask(filterTasks);
    } else {
        todoMain.textContent = "";
        todoMain.textContent = "Không tìm thấy task";
    }
})

// Hàm chỉnh sửa task
const editTask = async (taskId) => {
    const task = todoTasks.find(todo => todo.id === taskId); // Tìm task theo id

    // Điền dữ liệu vào form
    Object.keys(task).forEach(key => {
        if (form[key]) {
            form[key].value = task[key]; // Nếu không có giá trị thì để trống
        }
    });

    form.dataset.editingId = task.id; // Thêm edit id vào form
    modal.classList.add('show');
    modal.querySelector('.modal-title').innerHTML = 'Chỉnh Sửa Task';
};

// Hàm xóa task
const delTask = async (taskId) => {
    notie.confirm({
        text: 'Bạn có chắc chắn muốn xóa task này?',
        submitText: 'Xóa',
        cancelText: 'Hủy',
        submitCallback: async function () {
            try {
                // Xóa trên server
                await fetchApi(`${baseUrl}/${taskId}`, 'DELETE');
                
                // Xóa khỏi mảng local
                todoTasks = todoTasks.filter(todo => todo.id !== taskId);
                renderTask(todoTasks);
                showToast('success', "Đã xóa task thành công");
            } catch (error) {
                console.error('Lỗi khi xóa task:', error);
                showToast('error', 'Không thể xóa task');
            }
        },
        cancelCallback: function () {
            showToast('warning', "Đã hủy xóa task");
        }
    });
};

// Hàm cập nhật trạng thái hoàn thành của task
const completeTask = async (taskId) => {
    try {
        const taskIndex = todoTasks.findIndex(todo => todo.id === taskId);

        const task = todoTasks[taskIndex];
        const updatedTask = { ...task, isCompleted: !task.isCompleted };

        // Cập nhật trên server
        await fetchApi(`${baseUrl}/${taskId}`, 'PUT', updatedTask);
        
        // Cập nhật trong mảng local
        todoTasks[taskIndex] = updatedTask;
        
        // Render lại và giữ tab hiện tại
        const activeTab = [...tabList].findIndex(tab => tab.classList.contains('active'));
        filterActive(activeTab);
        
        showToast('success', updatedTask.isCompleted ? 'Đã đánh dấu hoàn thành' : 'Đã đánh dấu chưa hoàn thành');
    } catch (error) {
        console.error('Lỗi khi cập nhật task:', error);
        showToast('error', 'Không thể cập nhật trạng thái task');
    }
};


// Xử lý sự kiện click trên task grid (Event Delegation)
todoMain.onclick = (e) => {
    const taskCard = e.target.closest('.task-card');
    const taskId = taskCard?.dataset.taskId;
    
    if (!taskId) return;
    
    if (e.target.classList.contains('edit')) {
        editTask(taskId);
    }
    else if (e.target.classList.contains('delete')) {
        delTask(taskId);
    }
    else if (e.target.classList.contains('complete')) {
        completeTask(taskId);
    }
}

// Hàm chuyển đổi thời gian sang định dạng 12 giờ (AM/PM)
function formatHoursAndMinutes(time) {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(hours, minutes, 0, 0); 
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
    });
}

// Hàm chuyển đổi thời gian thành tổng số giây để so sánh
function getSecondTime(time) {
    const [hours, minutes] = time.split(':'); 
    const totalSeconds = (parseInt(hours) * 3600) + (parseInt(minutes) * 60);
    return totalSeconds; 
}

// Hàm kiểm tra validation cho form task
function validateField(newTask) {
    if(!newTask.title) {
        showToast('error', 'Tên tiêu đề không được trống');
        return false;
    }

    if(!newTask.startTime) {
        showToast('error', 'Giờ bắt đầu không được trống');
        return false;
    }

    if(!newTask.endTime) {
        showToast('error', 'Giờ kết thúc không được trống');
        return false;
    }

    if(getSecondTime(newTask.endTime) < getSecondTime(newTask.startTime)) {
        showToast('error', 'Giờ kết thúc bắt buộc lớn hơn giờ bắt đầu');
        return false;
    }
    
    if(!newTask.DueDate) {
        showToast('error', 'Ngày hết hạn không được trống');
        return false;
    }
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const tempDate = new Date(newTask.DueDate);
    tempDate.setHours(0, 0, 0, 0);

    if(tempDate < currentDate) {
        showToast('error', 'Ngày hết hạn phải lớn hơn hoặc bằng ngày hiện tại');
        return false;
    }

    if(!newTask.description) {
        showToast('error', 'Mô tả không được trống');
        return false;
    }
    
    return true;
}

// Hàm render danh sách task ra giao diện
function renderTask(todos) {    
    if (todos.length === 0) {
        todoMain.textContent = 'Không có task nào';
        return;
    }
    
    todoMain.innerHTML = ""; 
    
    todos.forEach((task, index) => {
        // Tạo thẻ task card
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card');
        taskCard.dataset.taskId = task.id; // Sử dụng ID thật từ server
        taskCard.classList.add(task.cardColor || 'blue');
            
        // Thêm class completed nếu task đã hoàn thành
        if (task.isCompleted) {
            taskCard.classList.add('completed');
        }

        // Tạo header của task
        const taskHeader = document.createElement('div');
        taskHeader.classList.add('task-header');
            
        // Tạo tiêu đề task
        const taskTitle = document.createElement('h3');
        taskTitle.classList.add('task-title');
        taskTitle.textContent = task.title;

        // Tạo menu button với dropdown
        const taskMenuButton = document.createElement('button');
        taskMenuButton.classList.add('task-menu');
        taskMenuButton.innerHTML = `
        <i class="fa-solid fa-ellipsis fa-icon"></i>
        <div class="dropdown-menu">
            <div class="dropdown-item edit">
                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                Edit
            </div>
            <div class="dropdown-item complete">
                <i class="fa-solid fa-check fa-icon"></i>
                ${task.isCompleted ? "Mark as active" : "Mark as Complete"}
            </div>
            <div class="dropdown-item delete">
                <i class="fa-solid fa-trash fa-icon"></i>
                Delete
            </div>
        </div>
    `;
        
        taskHeader.appendChild(taskTitle);
        taskHeader.appendChild(taskMenuButton);

        // Tạo mô tả task
        const taskDescription = document.createElement('p');
        taskDescription.classList.add('task-description');
        taskDescription.textContent = task.description; 

        // Tạo thời gian task
        const taskTime = document.createElement('div');
        taskTime.classList.add('task-time');
        taskTime.textContent = `${formatHoursAndMinutes(task.startTime)} - ${formatHoursAndMinutes(task.endTime)}`;

        // Ghép các phần tử vào task card
        taskCard.appendChild(taskHeader);
        taskCard.appendChild(taskDescription);
        taskCard.appendChild(taskTime);

        // Thêm task card vào container
        todoMain.appendChild(taskCard);
    });
}


form.onsubmit = async function handleFormSubmit(e) {
    e.preventDefault() ; 
    try {

        const formData = new FormData(form);
        const task = {
            title: formData.get('title').trim(),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            DueDate: formData.get('DueDate'),
            category: formData.get('category'),
            cardColor: formData.get('cardColor'),
            description: formData.get('description').trim(),
            priority: formData.get('priority').trim(),
            isCompleted: false
        };

        if (!validateField(task)) {
            return false;
        }

        const editingId = form.dataset.editingId; 
        const newTitle = task.title.toLowerCase();

        const isFailedTitle = todoTasks.some((todo) => {
            if (todo.id === editingId) return false; 
            return todo.title.toLowerCase() === newTitle;
        });

        if (isFailedTitle) {
            showToast('warning', 'Tên task đã tồn tại');
            return false;
        }

        if (editingId) {

            const existingTask = todoTasks.find(t => t.id === editingId);
            if (existingTask) {
                task.isCompleted = existingTask.isCompleted; // Giữ nguyên trạng thái hoàn thành
            }
            
            const updatedTask = await fetchApi(`${baseUrl}/${editingId}`, 'PUT', task);
            
            // Cập nhật trong mảng local
            const index = todoTasks.findIndex(t => t.id === editingId);
            if (index !== -1) {
                todoTasks[index] = updatedTask || task;
            }
            
            showToast('success', 'Cập nhật task thành công');
        } else {
            const newTask = await fetchApi(baseUrl, 'POST', task);
            todoTasks.push(newTask); 
            showToast('success', 'Thêm task thành công');
        }

        renderTask(todoTasks);
        form.reset();
        delete form.dataset.editingId;
        modal.classList.remove('show');

    } catch (error) {
        console.error('Lỗi khi xử lý task:', error);
        showToast('error', 'Có lỗi xảy ra khi xử lý task');
    }
}


// Khởi tạo ứng dụng
async function initApp() {
    try {
        await loadTasks();
    } catch (error) {
        console.error('Lỗi khởi tạo ứng dụng:', error);
        showToast('error', 'Không thể khởi tạo ứng dụng');
    }
}

// Bắt đầu ứng dụng
initApp();