// import { alert, confirm, prompt } from "https://esm.sh/@t007/dialog@latest";

let rootElement = undefined; // For testing scoped dialogs

window.showAlert = async function () {
  await alert("Hello, I'm Tobi007", { rootElement });
};

window.showConfirm = async function () {
  await confirm("You are about to know my identity, I'm Tobi007", { rootElement });
};

window.showPrompt = async function () {
  await prompt("Do you know who I am now?", "Yes", { rootElement });
};

window.playGame = async function () {
  async function log(...[message, formatting = "", options = {}]) {
    console.log(`${formatting ? "%c" : ""}${message}`, formatting);
    await alert(message, { ...options, rootElement });
  }
  (async function init() {
    let userChoice = await prompt("🎮 Would you like to play a game of Rock, Paper, Scissors? ✊ ✋ ✌️", "", { placeholder: "'y' for YES, 'n' for NO", required: true, rootElement });
    if (userChoice?.toLowerCase?.() === "y" || userChoice?.toUpperCase?.() === "YES") {
      await log("🔥 There are three rounds!!! 🔥");
      await playGame();
    } else if (userChoice?.toLowerCase?.() === "n" || userChoice?.toUpperCase?.() === "NO") await log("🙃 Play again and type in 'y' if you change your mind!", "", { confirmText: "Alright" });
    else await log("🤔 I hope you change your mind!", "", { confirmText: "Alright" });
  })();
  async function playGame() {
    let humanScore = 0;
    let computerScore = 0;
    async function playRound(humanChoice, computerChoice) {
      let HC = humanChoice?.toUpperCase?.();
      let CC = computerChoice?.toUpperCase?.();
      if (HC === "ROCK" && CC === "PAPER") {
        await log("❌ You lose this round! ✋ beats ✊", "color: red;", { confirmText: "Damn" });
        return computerScore++;
      } else if (HC === "PAPER" && CC === "SCISSORS") {
        await log("❌ You lose this round! ✌️ beats ✋", "color: red;", { confirmText: "Damn" });
        return computerScore++;
      } else if (HC === "SCISSORS" && CC === "ROCK") {
        await log("❌ You lose this round! ✊ beats ✌️", "color: red;", { confirmText: "Damn" });
        return computerScore++;
      } else if (CC === "ROCK" && HC === "PAPER") {
        await log("✅ You win this round! ✋ beats ✊", "color: green; font-weight: bold;", { confirmText: "Cool!" });
        return humanScore++;
      } else if (CC === "PAPER" && HC === "SCISSORS") {
        await log("✅ You win this round! ✌️ beats ✋", "color: green; font-weight: bold;", { confirmText: "Cool!" });
        return humanScore++;
      } else if (CC === "SCISSORS" && HC === "ROCK") {
        await log("✅ You win this round! ✊ beats ✌️", "color: green; font-weight: bold;", { confirmText: "Cool!" });
        return humanScore++;
      } else if (CC === HC) await log(`🤝 No Winner! You both chose ${humanChoice}.`, "color: blue;");
      else if (humanChoice) await log(`⚠️ Invalid choice! '${humanChoice}' is not an option.`, "color: purple;");
      else await log(`⚠️ You did not pick an option.`, "color: purple;");
    }
    function getComputerChoice() {
      let choices = ["rock", "paper", "scissors"];
      return choices[Math.floor(Math.random() * 3)];
    }
    async function getHumanChoice() {
      return await prompt("✊ Rock, Paper or Scissors? ✋ ✌️", "", { label: "Choose your pick 🕹️", required: true, minLength: 4, maxLength: 8, confirmText: "GO", rootElement });
    }
    for (let rounds = 1; rounds < 4; rounds++) {
      await log(`🎲 Round ${rounds} begins!`, "", { confirmText: "Sure" });
      await playRound(await getHumanChoice(), getComputerChoice());
    }
    if (computerScore > humanScore) await log(`🤖 Computer wins! Score: ${computerScore} 🆚 You: ${humanScore}`, "color: blue; font-weight: bold;", { confirmText: "Not fair :(" });
    else if (computerScore < humanScore) await log(`🏆 You win! Score: ${humanScore} 🆚 Computer: ${computerScore}`, "color: green; font-weight: bolder;", { confirmText: "I'm the best!" });
    else if (computerScore === humanScore) await log(`🤝 It's a tie! Both scored ${humanScore}!`, "color: brown;", { confirmText: "Too bad :(" });
  }
};

window.useScoped = function () {
  rootElement = rootElement ? undefined : document.querySelector(".info-wrapper");
  document.documentElement.classList.toggle("scoped", !!rootElement);
  document.getElementById("try-scoped-btn").textContent = rootElement ? "Use Global" : "Use Scoped";
};

window.toggleChromeTheme = function () {
  document.documentElement.classList.toggle("chrome-like");
  document.getElementById("try-chrome-btn").textContent = document.documentElement.classList.contains("chrome-like") ? "Back to Default" : "Try Chromelike";
};
