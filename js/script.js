$(document).ready(function () {
  "use strict";

  const baseUrl = "https://localhost:7131/api";

  let lists = [];
  let allItems = [];
  let currentList = null;
  let editingItem = null;

  // ================== Fetch All Items ==================
  function fetchAllItems() {
    fetch(`${baseUrl}/Items`)
      .then(res => res.json())
      .then(data => {
        allItems = data;
        renderAllItemsList();
      })
      .catch(err => console.error(err));
  }

  // ================== Render All Items ==================
  function renderAllItemsList() {
    const container = $(".all-items-list");
    container.empty();
    allItems.forEach((item, index) => {
      container.append(`
        <li class="list-group-item d-flex justify-content-between align-items-center" data-index="${index}">
          <span>${item.name} <small>${item.description}</small></span>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-warning edit-item-btn">Edit</button>
            <button class="btn btn-danger delete-item-btn">Delete</button>
          </div>
        </li>
      `);
    });
  }

  // ================== Fetch Lists ==================
  function fetchLists() {
    fetch(`${baseUrl}/Lists`)
      .then(res => res.json())
      .then(data => {
        lists = data;
        renderLists();
      })
      .catch(err => console.error(err));
  }

  // ================== Render Lists ==================
  function renderLists() {
    const container = $(".list-of-lists");
    container.empty();
    lists.forEach((list, index) => {
      container.append(`
        <li class="list-group-item" data-index="${index}">
          <span class="list-name">${list.name} - <small>${list.description}</small></span>
          <div class="mt-2">
            <button class="btn btn-sm btn-info edit-list-btn mb-1">Edit List</button>
            <button class="btn btn-sm btn-secondary manage-items-btn mb-1">Manage Items</button>
            <button class="btn btn-sm btn-danger delete-list-btn mb-1">Delete</button>
          </div>
          <div class="items-dropdown border p-2 mt-2 d-none" style="max-height:150px; overflow-y:auto;"></div>
        </li>
      `);
    });
  }

  // ================== Add New List ==================
  $(".show-add-list-btn").click(() => {
    $(".add-list-form").removeClass("d-none");
    $(".show-add-list-btn").addClass("d-none");
  });

  $(".cancel-list-btn").click(() => {
    $(".add-list-name").val('');
    $(".add-list-desc").val('');
    $(".add-list-form").addClass("d-none");
    $(".show-add-list-btn").removeClass("d-none");
  });

  $(".save-list-btn").click(() => {
    const name = $(".add-list-name").val().trim();
    const desc = $(".add-list-desc").val().trim();
    if (!name) return alert("Enter list name");

    fetch(`${baseUrl}/Lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc })
    })
    .then(() => {
      $(".add-list-name").val('');
      $(".add-list-desc").val('');
      $(".add-list-form").addClass("d-none");
      $(".show-add-list-btn").removeClass("d-none");
      fetchLists();
    })
    .catch(err => console.error(err));
  });

  // ================== Manage Items in List ==================
  $(document).on("click", ".manage-items-btn", function () {
    const li = $(this).closest("li");
    const index = li.data("index");
    currentList = lists[index];
    const dropdown = li.find(".items-dropdown");

    dropdown.empty();
    allItems.forEach(item => {
      const checked = currentList.items.some(i => i.id === item.id) ? "checked" : "";
      dropdown.append(`
        <div>
          <input type="checkbox" class="manage-item-checkbox" data-id="${item.id}" ${checked}> ${item.name}
        </div>
      `);
    });

    dropdown.toggleClass("d-none");

    // Render tasks in main area
    renderTasks();
  });

  // ================== Handle Manage Items Checkbox ==================
  $(document).on("change", ".manage-item-checkbox", function () {
    const itemId = parseInt($(this).data("id"));
    const checked = $(this).is(":checked");

    if (checked) {
      fetch(`${baseUrl}/Lists/AddItem/${currentList.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemId)
      }).then(() => {
        // update local copy
        const addedItem = allItems.find(i => i.id === itemId);
        if (!currentList.items.some(i => i.id === itemId)) currentList.items.push(addedItem);
        renderTasks();
      }).catch(err => console.error(err));
    } else {
      fetch(`${baseUrl}/Lists/RemoveItem/${currentList.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemId)
      }).then(() => {
        currentList.items = currentList.items.filter(i => i.id !== itemId);
        renderTasks();
      }).catch(err => console.error(err));
    }
  });

  // ================== Render Tasks in Main Area ==================
  function renderTasks() {
    const container = $(".todo-list");
    container.empty();
    if (!currentList || !currentList.items) return;

    currentList.items.forEach(item => {
      container.append(`
        <div class="todo-item ${item.isCompleted ? 'complete' : ''}" data-id="${item.id}">
          <input type="checkbox" class="task-checkbox" ${item.isCompleted ? 'checked' : ''}>
          <span>${item.name} <small>${item.description}</small></span>
          <button class="btn btn-sm btn-danger remove-todo-item">Delete</button>
        </div>
      `);
    });
    filterTasks();
  }

  // ================== Task Checkbox Toggle ==================
  $(document).on("change", ".task-checkbox", function () {
    const itemId = parseInt($(this).closest(".todo-item").data("id"));
    const item = currentList.items.find(i => i.id === itemId);
    item.isCompleted = $(this).is(":checked");

    fetch(`${baseUrl}/Items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    }).then(() => renderTasks())
      .catch(err => console.error(err));
  });

  // ================== Remove Task ==================
$(document).on("click", ".remove-todo-item", function () {
    const itemId = parseInt($(this).closest(".todo-item").data("id"));

    if (!currentList) return;

    fetch(`${baseUrl}/Lists/RemoveItem/${currentList.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemId)
    })
    .then(() => {
        currentList.items = currentList.items.filter(i => i.id !== itemId);
        renderTasks();
    })
    .catch(err => console.error(err));
});



$(document).on("click", ".delete-item-btn", function () {
    const index = $(this).closest("li").data("index");
    const item = allItems[index];

    if (!confirm(`Are you sure you want to delete "${item.name}" permanently?`)) return;

    fetch(`${baseUrl}/Items/${item.id}`, { method: "DELETE" })
      .then(() => {
        allItems.splice(index, 1);
        // حذف من كل القوائم المحلية كمان
        lists.forEach(list => {
            list.items = list.items.filter(i => i.id !== item.id);
        });
        renderAllItemsList();
        renderTasks();
      })
      .catch(err => console.error(err));
});


  // ================== Tabs Filter ==================
  $(".todo-nav .nav-link").click(function (e) {
    e.preventDefault();
    $(".todo-nav .nav-link").removeClass("active");
    $(this).addClass("active");
    filterTasks();
  });

function filterTasks() {
  const filter = $(".todo-nav .nav-link.active").text().trim();

  $(".todo-item").each(function() {
    const isComplete = $(this).hasClass("complete");

    if (filter === "All") {
      $(this).show(); // كل العناصر تظهر
    } else if (filter === "Active") {
      $(this).toggle(!isComplete); // اخفي المكتملة
    } else if (filter === "Completed") {
      $(this).toggle(isComplete); // اخفي غير المكتملة
    }
  });
}


  // ================== Add New Item ==================
  $(".add-item-btn").click(function () {
    const name = $(".add-task").val().trim();
    const desc = $(".add-task-desc").val().trim();
    if (!name) return alert("Enter item name");

    fetch(`${baseUrl}/Items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, isCompleted: false })
    })
      .then(res => res.json())
      .then(newItem => {
        allItems.push(newItem);
        renderAllItemsList();
        $(".add-task").val('');
        $(".add-task-desc").val('');
      })
      .catch(err => console.error(err));
  });

  // ================== Edit & Delete from All Items ==================
  $(document).on("click", ".edit-item-btn", function () {
    const index = $(this).closest("li").data("index");
    editingItem = allItems[index];
    $(".edit-item-name").val(editingItem.name);
    $(".edit-item-desc").val(editingItem.description);
    $("#editItemModal").modal("show");
  });

  $(".save-item-btn").click(function () {
    editingItem.name = $(".edit-item-name").val().trim();
    editingItem.description = $(".edit-item-desc").val().trim();

    fetch(`${baseUrl}/Items/${editingItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingItem)
    })
      .then(() => {
        editingItem = null;
        $("#editItemModal").modal("hide");
        fetchAllItems();
        if (currentList) fetchLists().then(() => renderTasks());
      })
      .catch(err => console.error(err));
  });

  $(document).on("click", ".delete-item-btn", function () {
    const index = $(this).closest("li").data("index");
    const item = allItems[index];
    fetch(`${baseUrl}/Items/${item.id}`, { method: "DELETE" })
      .then(() => {
        allItems.splice(index, 1);
        if (currentList) currentList.items = currentList.items.filter(i => i.id !== item.id);
        renderAllItemsList();
        renderTasks();
      })
      .catch(err => console.error(err));
  });
// ================== Show/Hide Add Item Form ==================
$('.show-add-item-btn').click(function() {
  $('.add-item-form').toggleClass('d-none'); // يظهر أو يخفي الفورم
});

$('.cancel-item-btn').click(function() {
  $('.add-item-form').addClass('d-none'); // يخفي الفورم
  $('.add-task').val(''); // يمسح الاسم
  $('.add-task-desc').val(''); // يمسح الوصف
});

// ================== Save New Item ==================
$('.save-new-item-btn').click(function() {
  const name = $('.add-task').val().trim();
  const desc = $('.add-task-desc').val().trim();
  if (!name) return alert("Enter item name");

  fetch(`${baseUrl}/Items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description: desc, isCompleted: false })
  })
  .then(res => res.json())
  .then(newItem => {
    allItems.push(newItem);
    renderAllItemsList();
    $('.add-task').val('');
    $('.add-task-desc').val('');
    $('.add-item-form').addClass('d-none');
  })
  .catch(err => console.error(err));
});
// ================== Delete List ==================
$(document).on("click", ".delete-list-btn", function() {
    const li = $(this).closest("li");
    const index = li.data("index");
    const list = lists[index];

    if (!confirm(`Are you sure you want to delete the list "${list.name}"?`)) return;

    fetch(`${baseUrl}/Lists/${list.id}`, { method: "DELETE" })
        .then(() => {
            // حذف محلياً من المصفوفة
            lists.splice(index, 1);
            renderLists();
            // لو القائمة الحالية هي دي، فاضي tasks area
            if (currentList && currentList.id === list.id) {
                currentList = null;
                $(".todo-list").empty();
            }
        })
        .catch(err => console.error(err));
});

  // ================== Initial Fetch ==================
  fetchAllItems();
  fetchLists();
});
