// import toast from "https://esm.sh/@t007/toast@latest";

let rootElement; // For testing scoped toasts

const positions = ["top-right", "top-left", "top-center", "bottom-right", "bottom-left", "bottom-center", "center-right", "center-left", "center-center"]; //just testing all possible positions
window.showToast = function showToast() {
  toast("Hello, I'm Tobi007", {
    position: positions[Math.floor(Math.random() * positions.length)],
    icon: "👋",
    image: "../../../assets/images/my_profile_s.jpeg",
    actions: { Visit: () => window.open("https://github.com/Tobi007-del", "_blank") },
    rootElement,
  });
};

window.showPromiseToast = function showToast() {
  toast.promise(undefined, {
    pending: { render: "Identity loading...", position: positions[Math.floor(Math.random() * positions.length)], rootElement },
    success: { render: "Call me, Tobi007", image: "../../../assets/images/my_profile_s.jpeg" },
    error: { render: "Identity fetch failed" },
  });
};

window.useScoped = function () {
  rootElement = rootElement ? undefined : document.querySelector(".info-wrapper");
  document.documentElement.classList.toggle("scoped", !!rootElement);
  document.getElementById("try-scoped-btn").textContent = rootElement ? "Use Global" : "Use Scoped";
  toast.doForAll("update", { rootElement });
};

window.toggleCorporateTheme = function toggleCorporateTheme() {
  document.documentElement.classList.toggle("corporate");
  document.getElementById("try-corporate-btn").textContent = document.documentElement.classList.contains("corporate") ? "Back to Default" : "Try Corporate";
};

setTimeout(() => {
  toast("Testing", { icon: "😀", autoClose: 1750, rootElement });
  setTimeout(() => {
    toast.info("You are about to see a quick demo", { position: "center-center", rootElement });
    setTimeout(() => {
      toast.success("You added 1 full chicken to bag", { position: "top-right", image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg", rootElement });
      toast.success("You added 1 full chicken to bag", { position: "top-left", rootElement });
      toast.error("Could not add 1 full chicken to bag", { position: "bottom-right", image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg", rootElement });
      toast.error("Could not add 1 full chicken to bag", { position: "bottom-left", rootElement });
      toast.warn("Not enough full chicken left to add 3 to bag", { position: "center-right", image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg", rootElement });
      toast.warn("Not enough full chicken left to add 3 to bag", { position: "center-left", rootElement });
      toast.info("You can add full chicken to bag here", { position: "top-center", image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg", rootElement });
      toast.info("You can add full chicken to bag here", { position: "bottom-center", rootElement });
      toast("You can add full chicken to bag here", { position: "center-center", image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg", rootElement });
      toast("You can add full chicken to bag here", { position: "center-center", rootElement });
    }, 4750);
  }, 2000);
});
