import { Alert, Confirm, Prompt } from "./T007_dialog.js";

window.showAlert = async function () {
  await Alert("Hello, I'm Tobi007");
};

window.showConfirm = async function () {
  await Confirm(
    "You are about to know my identity, I'm Tobi007",
  );
};

window.showPrompt = async function () {
  await Prompt("Do you know who I am now?", "Yes");
};

window.playGame = async function() {
  async function log(...args) {
    console.log(args[1] ? `%c ${args[0]}` : args[0], args[1] ?? "");
    await Alert(args[0]);
  }
  (async function init() {
    let userChoice = await Prompt(
      "🎮 Would you like to play a game of Rock, Paper, Scissors? ✊ ✋ ✌️",
      "",
      { placeholder: "'y' for YES, 'n' for NO", required: true }
    );
    if (
      userChoice?.toLowerCase?.() === "y" ||
      userChoice?.toUpperCase?.() === "YES"
    ) {
      await log("🔥 There are five rounds!!! 🔥");
      await playGame();
    } else if (
      userChoice?.toLowerCase?.() === "n" ||
      userChoice?.toUpperCase?.() === "NO"
    )
      await log("🙃 Reload the page and type in 'y' if you change your mind!");
    else await log("🤔 I hope you change your mind!");
  })();
  async function playGame() {
    let humanScore = 0;
    let computerScore = 0;
    async function playRound(humanChoice, computerChoice) {
      let HC = humanChoice?.toUpperCase?.();
      let CC = computerChoice?.toUpperCase?.();
      if (HC === "ROCK" && CC === "PAPER") {
        await log("❌ You lose this round! ✋ beats ✊", "color: red;");
        return computerScore++;
      } else if (HC === "PAPER" && CC === "SCISSORS") {
        await log("❌ You lose this round! ✌️ beats ✋", "color: red;");
        return computerScore++;
      } else if (HC === "SCISSORS" && CC === "ROCK") {
        await log("❌ You lose this round! ✊ beats ✌️", "color: red;");
        return computerScore++;
      } else if (CC === "ROCK" && HC === "PAPER") {
        await log(
          "✅ You win this round! ✋ beats ✊",
          "color: green; font-weight: bold;"
        );
        return humanScore++;
      } else if (CC === "PAPER" && HC === "SCISSORS") {
        await log(
          "✅ You win this round! ✌️ beats ✋",
          "color: green; font-weight: bold;"
        );
        return humanScore++;
      } else if (CC === "SCISSORS" && HC === "ROCK") {
        await log(
          "✅ You win this round! ✊ beats ✌️",
          "color: green; font-weight: bold;"
        );
        return humanScore++;
      } else if (CC === HC)
        await log(
          `🤝 No Winner! You both chose ${humanChoice}.`,
          "color: blue;"
        );
      else if (humanChoice)
        await log(
          `⚠️ Invalid choice! '${humanChoice}' is not an option.`,
          "color: purple;"
        );
      else await log(`⚠️ You did not pick an option.`, "color: purple;");
    }
    function getComputerChoice() {
      let choices = ["rock", "paper", "scissors"];
      return choices[Math.floor(Math.random() * 3)];
    }
    async function getHumanChoice() {
      return await Prompt("✊ Rock, Paper or Scissors? ✋ ✌️", "", {
        label: "Choose your pick 🕹️",
        required: true,
        minLength: 4,
        maxLength: 8,
      });
    }
    for (let rounds = 1; rounds < 6; rounds++) {
      await log(`🎲 Round ${rounds} begins!`);
      await playRound(await getHumanChoice(), getComputerChoice());
    }
    if (computerScore > humanScore)
      await log(
        `🤖 Computer wins! Score: ${computerScore} 🆚 You: ${humanScore}`,
        "color: blue; font-weight: bold;"
      );
    else if (computerScore < humanScore)
      await log(
        `🏆 You win! Score: ${humanScore} 🆚 Computer: ${computerScore}`,
        "color: green; font-weight: bolder;"
      );
    else if (computerScore === humanScore)
      await log(`🤝 It's a tie! Both scored ${humanScore}!`, "color: brown;");
  }
}