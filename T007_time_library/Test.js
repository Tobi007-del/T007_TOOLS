if (typeof window === "undefined") {
  require("./T007_time");
  setInterval(() => console.log(global.getTime("now")), 1000);
} else {
  const timeDiv = document.querySelector(".time");
  setInterval(() => (timeDiv.innerText = `${window.getTime("now")}`), 1000);
}
