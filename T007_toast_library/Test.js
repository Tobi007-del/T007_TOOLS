import Toast from "./T007_toast.js"

//just testing all possible positions
const positions = ["top-right", "top-left", "top-center", "bottom-right", "bottom-left", "bottom-center", "center-right", "center-left", "center-center"]
window.showToast = function showToast() {
  Toast({
    position: positions[Math.floor(Math.random() * positions.length)],
    data: {
      type: "info",
      image: "../assets/images/my_profile_s.jpeg",
      body: "Hello, I'm Tobi007"
    }
  })
}

Toast({
  position: "top-right",
  data: {
    type: "success",
    image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
    body: "You added 1 full chicken to bag"
  }
})
Toast({
  position: "top-left",
  data: {
    type: "success",
    body: "You added 1 full chicken to bag"
  }
})
Toast({
  position: "bottom-right",
  data: {
    type: "error",
    image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
    body: "Could not add 1 full chicken to bag"
  }
})
Toast({
  position: "bottom-left",
  data: {
    type: "error",
    body: "Could not add 1 full chicken to bag"
  }
})
Toast({
  position: "center-right",
  data: {
    type: "warning",
    image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
    body: "Not enough full chicken left to add 3 to bag"
  }
})
Toast({
  position: "center-left",
  data: {
    type: "warning",
    body: "Not enough full chicken left to add 3 to bag"
  }
})
Toast({
  position: "top-center",
  data: {
    type: "info",
    image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
    body: "You can add full chicken to bag here"
  }
})
Toast({
  position: "bottom-center",
  data: {
    type: "info",
    body: "You can add full chicken to bag here"
  }
})
Toast({
  position: "center-center",
  data: {
    image: "/RESTAURANT_THEMED_SITE/assets/tastey-meal-images/tastey_meal_one.jpg",
    body: "You can add full chicken to bag here"
  }
})
Toast({
  position: "center-center",
  data: {
    body: "You can add full chicken to bag here"
  }
})
