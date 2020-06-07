import JSZip from "jszip";
const files = document.querySelector(".files");

let db;
let folders = {};
let currentFolder = "";
let focusNode = files.parentNode;
let currentFile = "playground.tao";
let currentFileName = "playground.tao";

files.parentNode.onclick = function () {
  currentFolder = "";
  focusNode.classList.remove("fs-focus");
  this.classList.add("fs-focus");
  focusNode = this;
};

if (!window.indexedDB) {
  files.innerHTML = "Your browser doesn't support IndexedDB";
} else {
  let request = indexedDB.open("FileSystemDB", 2);

  request.onerror = function (event) {
    console.log(event);
  };

  request.onsuccess = function (event) {
    db = event.target.result;

    let filesObjectStore = db
      .transaction("files", "readonly")
      .objectStore("files");
    let getAll = filesObjectStore.getAll();
    getAll.onsuccess = function (event) {
      if (event.target.result.length === 0) {
        create("playground.tao");
      }

      files.innerHTML = "";

      for (const file of event.target.result) {
        let playground = file.path == "playground.tao";
        let parts = file.path.split("/");

        let root = files;
        let rootPath = "";

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
            let folder = getOrCreateFolder(root, element, rootPath);
            root = folder.node;
            rootPath = folder.path;
          }
        }
      }
    };
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;

    if (event.oldVersion != 0) {
      db.deleteObjectStore("files");
    }

    db.createObjectStore("files", { keyPath: "path" });
  };
}

function createFile(root, name, file, playground) {
  let li = document.createElement("li");
  let text = document.createElement("p");
  li.classList.add("link");
  text.innerText = name;
  li.append(text);

  li.onclick = () => {
    let filesObjectStore = db
      .transaction("files", "readonly")
      .objectStore("files");
    let get = filesObjectStore.get(file.path);

    get.onsuccess = (event) => {
      const reader = new FileReader();

      reader.addEventListener("loadend", (e) => {
        const text = e.srcElement.result;
        editor.setValue(text);
      });

      reader.readAsText(event.target.result.blob);
    };

    currentFile = file.path;
    currentFileName = name;

    document.querySelector(".overlay").style.display = "none";
  };

  let icon = document.createElement("img");
  icon.classList.add("delete");
  icon.loading = "lazy";
  icon.width = "20";
  icon.height = "20";
  icon.src = "icons/icons8-delete-bin-50.png";
  icon.onclick = function (e) {
    if (confirm("Are you sure")) {
      let del = db
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

function getOrCreateFolder(root, name, rootPath) {
  if (folders[`${rootPath}-${name}`] != null) {
    return {
      node: folders[`${rootPath}-${name}`].querySelector("ul"),
      path: rootPath !== "" ? `${rootPath}/${name}` : name,
      created: false,
    };
  }

  let folder = document.createElement("div");
  folder.classList.add("folder");

  let text = document.createElement("p");
  text.onclick = function (e) {
    currentFolder = rootPath !== "" ? `${rootPath}/${name}` : name;
    this.parentNode.classList.toggle("hide-children");
    focusNode.classList.remove("fs-focus");
    this.parentNode.classList.add("fs-focus");
    focusNode = this.parentNode;
    e.stopPropagation();
  };
  let icon = document.createElement("img");
  icon.loading = "lazy";
  icon.width = "10";
  icon.height = "10";
  icon.src = "icons/icons8-folder-50.png";

  text.append(icon);

  let textName = document.createTextNode(name);

  text.append(textName);
  folder.append(text);

  let contents = document.createElement("ul");
  contents.classList.add("files");
  folder.append(contents);

  root.append(folder);

  folders[`${rootPath}-${name}`] = folder;

  return {
    node: contents,
    path: rootPath !== "" ? `${rootPath}/${name}` : name,
    created: true,
  };
}

function create(path) {
  let filesObjectStore = db
    .transaction("files", "readwrite")
    .objectStore("files");

  const file = {
    path: path,
    blob: new Blob([], { type: "text/plain" }),
  };
  let add = filesObjectStore.add(file);

  add.onsuccess = function (event) {
    let parts = path.split("/");

    let root = files;
    let rootPath = "";

    for (let i = 0; i < parts.length; i++) {
      const element = parts[i];

      if (element == "") continue;

      if (i === parts.length - 1) {
        createFile(root, element, file, false);
      } else {
        let folder = getOrCreateFolder(root, element, rootPath);
        root = folder.node;
        rootPath = folder.path;
      }
    }
  };
}

export function newFile() {
  let name = prompt("File name");

  if (!name || name.length < 1) return;
  if (name.length > 255) {
    alert("Name can't be more than 255 character long");
    return;
  }
  if (/\//g.test(name)) {
    alert("Unsupported character");
    return;
  }

  let filesObjectStore = db
    .transaction("files", "readonly")
    .objectStore("files");
  let get = filesObjectStore.get(
    currentFolder !== "" ? `${currentFolder}/${name}` : name
  );

  get.onsuccess = (event) => {
    if (event.target.result != null) {
      alert("file already exists");
      return;
    }

    create(currentFolder !== "" ? `${currentFolder}/${name}` : name);
  };
}

export function newFolder() {
  let name = prompt("Folder name");

  if (!name || name.length < 1) return;
  if (name.length > 255) {
    alert("Name can't be more than 255 character long");
    return;
  }
  if (/\//g.test(name)) {
    alert("Unsupported character");
    return;
  }

  let parts = currentFolder.split("/");

  let root = files;
  let rootPath = "";

  for (let i = 0; i < parts.length; i++) {
    const element = parts[i];

    if (element == "") continue;

    let folder = getOrCreateFolder(root, element, rootPath);
    root = folder.node;
    rootPath = folder.path;
  }

  if (folders[`${rootPath}-${name}`] != null) {
    alert("Folder already exists");
    return;
  }

  let folder = getOrCreateFolder(root, name, rootPath);

  currentFolder = rootPath !== "" ? `${rootPath}/${name}` : name;
  focusNode.classList.remove("fs-focus");
  folder.node.parentNode.classList.add("fs-focus");
  focusNode = folder.node.parentNode;
}

export function save() {
  let filesObjectStore = db
    .transaction("files", "readwrite")
    .objectStore("files");

  let file = {
    path: currentFile,
    blob: new Blob([editor.getValue()], { type: "text/plain" }),
  };
  let Save = filesObjectStore.put(file);

  save.onsuccess = function (event) {};
}

export function currentFilename() {
  return currentFileName;
}

export function downloadAll() {
  let zip = new JSZip();

  let filesObjectStore = db
    .transaction("files", "readonly")
    .objectStore("files");
  let getAll = filesObjectStore.getAll();
  getAll.onsuccess = function (event) {
    for (const file of event.target.result) {
      zip.file(file.path, file.blob);
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
      let a = document.createElement("a"),
        url = URL.createObjectURL(content);
      a.href = url;
      a.download = "fs.zip";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    });
  };
}
