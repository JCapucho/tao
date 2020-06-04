const files = document.querySelector(".files");

let currentFolder = "";
let focus_node = files.parentNode;
let current_file = "playground.tao";
let current_file_name = "playground.tao";

files.parentNode.onclick = function () {
  currentFolder = "";
  focus_node.classList.remove("fs-focus");
  this.classList.add("fs-focus");
  focus_node = this;
};

if (!window.indexedDB) {
  console.log(
    "Your browser doesn't support a stable version of IndexedDB. The fs tab won't work"
  );
  files.innerHTML = "Your browser doesn't support IndexedDB";
} else {
  var db;
  var request = indexedDB.open("MyTestDatabase");
  request.onerror = function (event) {
    console.log(event);
  };
  request.onsuccess = function (event) {
    db = event.target.result;

    var filesObjectStore = db
      .transaction("files", "readonly")
      .objectStore("files");
    var get_all = filesObjectStore.getAll();
    get_all.onsuccess = function (event) {
      if (event.target.result.length === 0) {
        create("playground.tao");
      }

      files.innerHTML = "";

      for (const file of event.target.result) {
        let playground = file.path == "playground.tao";
        let parts = file.path.split("/");

        let root = files;
        let root_path = "";

        for (let i = 0; i < parts.length; i++) {
          const element = parts[i];

          if (element == "") continue;

          if (i === parts.length - 1) {
            createFile(root, element, file, playground);

            if (playground) {
              const reader = new FileReader();

              reader.addEventListener("loadend", (e) => {
                const text = e.srcElement.result;
                editor.setValue(text);
              });

              reader.readAsText(file.blob);
            }
          } else {
            let folder = getOrCreateFolder(root, element, root_path);
            root = folder.node;
            root_path = folder.path;
          }
        }
      }
    };
  };

  request.onupgradeneeded = function (event) {
    // Save the IDBDatabase interface
    var db = event.target.result;

    var objectStore = db.createObjectStore("files", { keyPath: "path" });
  };
}

function createFile(root, name, file, playground) {
  let li = document.createElement("li");
  li.classList.add("link");
  li.innerText = name;
  li.onclick = () => {
    var filesObjectStore = db
      .transaction("files", "readonly")
      .objectStore("files");
    var get = filesObjectStore.get(file.path);

    get.onsuccess = (event) => {
      const reader = new FileReader();

      reader.addEventListener("loadend", (e) => {
        const text = e.srcElement.result;
        editor.setValue(text);
      });

      reader.readAsText(event.target.result.blob);
    };

    current_file = file.path;
    current_file_name = name;

    document.querySelector(".overlay").style.display = "none";
  };

  let icon = document.createElement("img");
  icon.classList.add("delete");
  icon.loading = "lazy";
  icon.width = "12";
  icon.height = "12";
  icon.src = "icons/icons8-delete-bin-50.png";
  icon.onclick = function (e) {
    if (confirm("Are you sure")) {
      var del = db
        .transaction("files", "readwrite")
        .objectStore("files")
        .delete(file.path);

      del.onsuccess = () => {
        this.parentNode.remove();
      };
    }

    e.stopPropagation();
  };

  if (!playground) {
    li.append(icon);
  }
  root.append(li);
}

function getOrCreateFolder(root, name, root_path) {
  if (root.querySelector(`#folders-${root_path}-${name}`) != null) {
    return {
      node: root
        .querySelector(`#folders-${root_path}-${name}`)
        .querySelector("ul"),
      path: `${root_path}/${name}`,
      created: false,
    };
  }

  let folder = document.createElement("div");
  folder.classList.add("folder");
  folder.id = `folders-${root_path}-${name}`;

  let text = document.createElement("p");
  text.onclick = function (e) {
    currentFolder = `${root_path}/${name}`;
    this.parentNode.classList.toggle("hide-children");
    focus_node.classList.remove("fs-focus");
    this.parentNode.classList.add("fs-focus");
    focus_node = this.parentNode;
    e.stopPropagation();
  };
  let icon = document.createElement("img");
  icon.loading = "lazy";
  icon.width = "10";
  icon.height = "10";
  icon.src = "icons/icons8-folder-50.png";

  text.append(icon);

  let text_name = document.createTextNode(name);

  text.append(text_name);
  folder.append(text);

  let contents = document.createElement("ul");
  contents.classList.add("files");
  folder.append(contents);

  root.append(folder);

  return {
    node: contents,
    path: `${root_path}/${name}`,
    created: true,
  };
}

function create(path) {
  var filesObjectStore = db
    .transaction("files", "readwrite")
    .objectStore("files");

  let file = {
    path: path,
    blob: new Blob([], { type: "text/plain" }),
  };
  var add = filesObjectStore.add(file);

  add.onsuccess = function (event) {
    let parts = path.split("/");

    let root = files;
    let root_path = "";

    for (let i = 0; i < parts.length; i++) {
      const element = parts[i];

      if (element == "") continue;

      if (i === parts.length - 1) {
        createFile(root, element, file, false);
      } else {
        let folder = getOrCreateFolder(root, element, root_path);
        root = folder.node;
        root_path = folder.path;
      }
    }
  };
}

module.exports.newFile = function () {
  let name = prompt("File name");

  if (name.length < 1) return;

  create(`${currentFolder}/${name}`);
};

module.exports.newFolder = function () {
  let name = prompt("Folder name");

  if (name.length < 1) return;

  let parts = currentFolder.split("/");

  let root = files;
  let root_path = "";

  for (let i = 0; i < parts.length; i++) {
    const element = parts[i];

    if (element == "") continue;

    let folder = getOrCreateFolder(root, element, root_path);
    root = folder.node;
    root_path = folder.path;
  }

  let folder = getOrCreateFolder(root, name, root_path);

  console.log(folder.node);
  
  currentFolder = `${root_path}/${name}`;
  focus_node.classList.remove("fs-focus");
  folder.node.parentNode.classList.add("fs-focus");
  focus_node = folder.node.parentNode;
};

module.exports.save = function () {
  var filesObjectStore = db
    .transaction("files", "readwrite")
    .objectStore("files");

  let file = {
    path: current_file,
    blob: new Blob([editor.getValue()], { type: "text/plain" }),
  };
  var Save = filesObjectStore.put(file);

  save.onsuccess = function (event) {};
};

module.exports.currentFilename = function () {
  return current_file_name;
};
