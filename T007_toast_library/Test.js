import Toast from "./T007_toast.js";

//just testing all possible positions
const positions = ["top-right", "top-left", "top-center", "bottom-right", "bottom-left", "bottom-center", "center-right", "center-left", "center-center"];
window.showToast = function showToast() {
  Toast.info("Hello, I'm Tobi007", {
    position: positions[Math.floor(Math.random() * positions.length)],
    image: "../assets/images/my_profile_s.jpeg",
  });
};
window.showPromiseToast = function showToast() {
  Toast.promise(undefined, {
    pending: { render: "Identity loading...", position: positions[Math.floor(Math.random() * positions.length)] },
    success: { render: "Call me, Tobi007", image: "../assets/images/my_profile_s.jpeg" },
    error: "Identity fetch failed",
  });
};

setTimeout(() => {
  Toast("Testing", { icon: "😀", autoClose: 1750 });
  setTimeout(() => {
    Toast.info("You are about to see a quick demo", {
      position: "center-center",
    });
    setTimeout(() => {
      Toast.success("You added 1 full chicken to bag", {
        position: "top-right",
        image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
      });

      Toast.success("You added 1 full chicken to bag", {
        position: "top-left",
      });

      Toast.error("Could not add 1 full chicken to bag", {
        position: "bottom-right",
        image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
      });

      Toast.error("Could not add 1 full chicken to bag", {
        position: "bottom-left",
      });

      Toast.warn("Not enough full chicken left to add 3 to bag", {
        position: "center-right",
        image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
      });

      Toast.warn("Not enough full chicken left to add 3 to bag", {
        position: "center-left",
      });

      Toast.info("You can add full chicken to bag here", {
        position: "top-center",
        image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
      });

      Toast.info("You can add full chicken to bag here", {
        position: "bottom-center",
      });

      Toast("You can add full chicken to bag here", {
        position: "center-center",
        image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
      });

      Toast("You can add full chicken to bag here", {
        position: "center-center",
      });
    }, 4750);
  }, 2000);
});
