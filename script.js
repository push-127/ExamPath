// =====================================
// EXAMPATH - MAIN JAVASCRIPT
// =====================================

const $ = (id) => document.getElementById(id);

// Save and read browser data
function readData(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}


// =====================================
// STEP 11 - EXAM SEARCH AND FILTER
// =====================================

const exams = [
  {
    id: "banking",
    name: "Banking Exams",
    description: "Sample information for banking recruitment preparation.",
    qualification: "Degree",
    minAge: 20,
    maxAge: 30,
    subjects: "Reasoning, Quantitative Aptitude, English and General Awareness"
  },
  {
    id: "ssc",
    name: "SSC Exams",
    description: "Sample information for Staff Selection Commission preparation.",
    qualification: "12th / Degree",
    minAge: 18,
    maxAge: 30,
    subjects: "Reasoning, Quantitative Aptitude, English and General Awareness"
  },
  {
    id: "railway",
    name: "Railway Exams",
    description: "Sample information for railway recruitment preparation.",
    qualification: "10th / 12th / Degree",
    minAge: 18,
    maxAge: 33,
    subjects: "Mathematics, General Intelligence, General Science and Awareness"
  },
  {
    id: "defence",
    name: "Defence Exams",
    description: "Sample information for selected defence recruitment pathways.",
    qualification: "12th / Degree",
    minAge: 17,
    maxAge: 25,
    subjects: "General Knowledge, English and Mathematics"
  }
];

function displayExams(container, search = "", sort = "default") {
  if (!container) return;

  let results = exams.filter(exam =>
    (exam.name + " " + exam.description)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (sort === "az") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (results.length === 0) {
    container.innerHTML = "<p>No matching exam category found.</p>";
    return;
  }

  container.innerHTML = results.map(exam => `
    <article class="exam-card">
      <span class="tag">SAMPLE CATEGORY</span>
      <h3>${exam.name}</h3>
      <p>${exam.description}</p>
      <p><strong>Illustrative qualification:</strong> ${exam.qualification}</p>
      <p><strong>Illustrative age:</strong> ${exam.minAge}–${exam.maxAge}</p>
      <p><strong>Subjects:</strong> ${exam.subjects}</p>
      <a href="eligibility.html?group=${exam.id}">
        Check sample criteria →
      </a>
    </article>
  `).join("");
}

// Homepage search
if ($("homeExamResults")) {
  displayExams($("homeExamResults"));

  $("searchButton").addEventListener("click", () => {
    displayExams(
      $("homeExamResults"),
      $("examSearch").value
    );

    $("searchMessage").textContent = "Search results updated.";
  });

  $("examSearch").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      $("searchButton").click();
    }
  });
}

// Exam directory search and sorting
if ($("examList")) {
  function updateExamList() {
    displayExams(
      $("examList"),
      $("examFilter").value,
      $("examSort").value
    );
  }

  $("examFilter").addEventListener("input", updateExamList);
  $("examSort").addEventListener("change", updateExamList);

  updateExamList();
}


// =====================================
// STUDY PLANNER
// =====================================

const TASK_KEY = "exampath_tasks_v2";

function displayTasks() {
  if (!$("taskList")) return;

  const tasks = readData(TASK_KEY, []);

  const completed = tasks.filter(task => task.done).length;

  $("totalTasks").textContent = tasks.length;
  $("completedTasks").textContent = completed;

  const percentage = tasks.length
    ? Math.round(completed / tasks.length * 100)
    : 0;

  $("taskProgress").textContent = percentage + "%";

  if (tasks.length === 0) {
    $("taskList").innerHTML =
      "<p class='muted'>No tasks yet. Add your first study task.</p>";
    return;
  }

  $("taskList").innerHTML = tasks.map(task => `
    <div class="task-item ${task.done ? "done" : ""}">
      <input
        type="checkbox"
        data-task-check="${task.id}"
        ${task.done ? "checked" : ""}
        aria-label="Mark task complete"
      >

      <div class="task-info">
        <strong class="task-title">
          ${escapeHTML(task.title)}
        </strong>

        <small>
          ${escapeHTML(task.subject)} · ${escapeHTML(task.date)}
        </small>
      </div>

      <button
        type="button"
        data-task-delete="${task.id}"
      >
        Delete
      </button>
    </div>
  `).join("");
}

if ($("taskForm")) {

  $("taskDate").value = new Date().toISOString().slice(0, 10);

  // Add new task
  $("taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const tasks = readData(TASK_KEY, []);

    const newTask = {
      id: Date.now().toString(),
      title: $("taskTitle").value.trim(),
      date: $("taskDate").value,
      subject: $("taskSubject").value,
      done: false
    };

    tasks.push(newTask);

    saveData(TASK_KEY, tasks);

    $("taskForm").reset();

    $("taskDate").value = new Date().toISOString().slice(0, 10);

    displayTasks();
  });

  // Complete task
  $("taskList").addEventListener("change", event => {
    const id = event.target.dataset.taskCheck;

    if (!id) return;

    const tasks = readData(TASK_KEY, []).map(task =>
      task.id === id
        ? { ...task, done: event.target.checked }
        : task
    );

    saveData(TASK_KEY, tasks);

    displayTasks();
  });

  // Delete task
  $("taskList").addEventListener("click", event => {
    const id = event.target.dataset.taskDelete;

    if (!id) return;

    const tasks = readData(TASK_KEY, [])
      .filter(task => task.id !== id);

    saveData(TASK_KEY, tasks);

    displayTasks();
  });

  // Remove completed tasks
  $("clearCompleted").addEventListener("click", () => {
    const tasks = readData(TASK_KEY, [])
      .filter(task => !task.done);

    saveData(TASK_KEY, tasks);

    displayTasks();
  });

  displayTasks();
}


// =====================================
// STEP 8 - MOCK TEST SYSTEM
// =====================================

const questions = [
  {
    question: "What is 25% of 200?",
    options: ["25", "40", "50", "75"],
    answer: 2,
    explanation: "25% means one-fourth. 200 divided by 4 is 50."
  },
  {
    question: "Find the next number: 2, 4, 8, 16, __",
    options: ["20", "24", "30", "32"],
    answer: 3,
    explanation: "Each number is multiplied by 2. 16 × 2 = 32."
  },
  {
    question: "Choose the correctly spelled word.",
    options: ["Recieve", "Receive", "Receeve", "Receve"],
    answer: 1,
    explanation: "The correct spelling is Receive."
  },
  {
    question: "Five pens cost ₹50. What is the cost of one pen?",
    options: ["₹5", "₹8", "₹10", "₹15"],
    answer: 2,
    explanation: "₹50 divided by 5 equals ₹10."
  },
  {
    question: "Which is the largest planet in our solar system?",
    options: ["Earth", "Mars", "Saturn", "Jupiter"],
    answer: 3,
    explanation: "Jupiter is the largest planet in our solar system."
  }
];

let currentQuestion = 0;

let userAnswers = Array(questions.length).fill(null);

function displayQuestion() {
  if (!$("questionText")) return;

  const question = questions[currentQuestion];

  $("questionCounter").textContent =
    `Question ${currentQuestion + 1} of ${questions.length}`;

  $("answeredCounter").textContent =
    `${userAnswers.filter(answer => answer !== null).length} answered`;

  $("quizProgress").style.width =
    ((currentQuestion + 1) / questions.length * 100) + "%";

  $("questionText").textContent = question.question;

  $("options").innerHTML = question.options.map((option, index) => `
    <label class="option ${
      userAnswers[currentQuestion] === index ? "selected" : ""
    }">
      <input
        type="radio"
        name="answer"
        value="${index}"
        ${userAnswers[currentQuestion] === index ? "checked" : ""}
      >
      ${String.fromCharCode(65 + index)}. ${option}
    </label>
  `).join("");

  $("options").querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      userAnswers[currentQuestion] = Number(input.value);
      displayQuestion();
    });
  });

  $("prevQuestion").disabled = currentQuestion === 0;

  $("nextQuestion").disabled =
    currentQuestion === questions.length - 1;
}

function submitMockTest() {
  const score = userAnswers.reduce((total, answer, index) => {
    return total + (answer === questions[index].answer ? 1 : 0);
  }, 0);

  const history = readData("exampath_mock_history", []);

  history.unshift({
    date: new Date().toLocaleString(),
    score: score,
    total: questions.length
  });

  saveData("exampath_mock_history", history.slice(0, 20));

  $("quizArea").classList.add("hidden");
  $("resultArea").classList.remove("hidden");

  $("scoreText").textContent =
    `${score} / ${questions.length}`;

  const percentage = Math.round(score / questions.length * 100);

  const unanswered = userAnswers.filter(
    answer => answer === null
  ).length;

  $("resultSummary").textContent =
    `${percentage}% · ${unanswered} unanswered`;

  $("reviewList").innerHTML = questions.map((question, index) => {
    const answer = userAnswers[index];

    return `
      <div class="review-item">
        <strong>${index + 1}. ${question.question}</strong>

        <p class="${
          answer === question.answer ? "correct" : "wrong"
        }">
          Your answer:
          ${answer === null ? "Not answered" : question.options[answer]}
        </p>

        <p>
          Correct answer: ${question.options[question.answer]}
        </p>

        <small>${question.explanation}</small>
      </div>
    `;
  }).join("");
}

if ($("quizArea")) {

  displayQuestion();

  $("prevQuestion").addEventListener("click", () => {
    currentQuestion--;
    displayQuestion();
  });

  $("nextQuestion").addEventListener("click", () => {
    currentQuestion++;
    displayQuestion();
  });

  $("submitTest").addEventListener("click", () => {
    if (
      userAnswers.some(answer => answer === null) &&
      !confirm("Some questions are unanswered. Submit anyway?")
    ) {
      return;
    }

    submitMockTest();
  });

  $("retakeTest").addEventListener("click", () => {
    currentQuestion = 0;
    userAnswers = Array(questions.length).fill(null);

    $("resultArea").classList.add("hidden");
    $("quizArea").classList.remove("hidden");

    displayQuestion();
  });
}


// =====================================
// STEP 9 - ELIGIBILITY CHECKER
// =====================================

if ($("eligibilityForm")) {

  const params = new URLSearchParams(location.search);

  if (params.has("group")) {
    $("candidateGroup").value = params.get("group");
  }

  $("eligibilityForm").addEventListener("submit", event => {
    event.preventDefault();

    const age = Number($("candidateAge").value);
    const qualification = $("candidateQualification").value;
    const group = $("candidateGroup").value;

    const qualificationRank = {
      "10": 1,
      "12": 2,
      "degree": 3,
      "pg": 4
    };

    const results = exams
      .filter(exam => group === "all" || exam.id === group)
      .map(exam => {

        const minimumQualification =
          exam.id === "banking" ? 3 :
          exam.id === "railway" ? 1 : 2;

        const ageMatches =
          age >= exam.minAge && age <= exam.maxAge;

        const qualificationMatches =
          qualificationRank[qualification] >= minimumQualification;

        const matches = ageMatches && qualificationMatches;

        return `
          <article class="exam-card">
            <h3>${exam.name}</h3>

            <p class="${matches ? "correct" : "wrong"}">
              <strong>
                ${matches
                  ? "Matches sample rules"
                  : "Does not match sample rules"}
              </strong>
            </p>

            <p>
              Age: ${ageMatches ? "Within" : "Outside"}
              illustrative range (${exam.minAge}–${exam.maxAge}).
            </p>

            <p>
              Qualification:
              ${qualificationMatches ? "Meets" : "Does not meet"}
              illustrative minimum.
            </p>
          </article>
        `;
      });

    $("eligibilityResults").innerHTML =
      "<h2>Sample Results</h2><div class='exam-grid'>" +
      results.join("") +
      "</div>";
  });
}


// =====================================
// STEP 10 - STUDENT DASHBOARD
// =====================================

if ($("dashTotal")) {

  const tasks = readData(TASK_KEY, []);

  const completed = tasks.filter(task => task.done).length;

  const history = readData("exampath_mock_history", []);

  $("dashTotal").textContent = tasks.length;

  $("dashDone").textContent = completed;

  $("dashTests").textContent = history.length;

  const bestScore = history.length
    ? Math.max(
        ...history.map(test =>
          Math.round(test.score / test.total * 100)
        )
      )
    : null;

  $("dashBest").textContent =
    bestScore === null ? "—" : bestScore + "%";

  const progress = tasks.length
    ? Math.round(completed / tasks.length * 100)
    : 0;

  $("dashProgressBar").style.width = progress + "%";

  $("dashProgressText").textContent = tasks.length
    ? `${completed} of ${tasks.length} tasks completed (${progress}%).`
    : "No tasks added yet. Create a study plan.";

  $("dashHistory").innerHTML = history.length
    ? history.slice(0, 5).map(test => `
        <div class="history-row">
          <strong>
            ${test.score}/${test.total}
            (${Math.round(test.score / test.total * 100)}%)
          </strong>
          <br>
          <small>${escapeHTML(test.date)}</small>
        </div>
      `).join("")
    : "No mock tests completed yet.";
}



// =====================================
// STEP 12 - REAL USER AUTHENTICATION
// =====================================

const API_BASE_URL = "http://localhost:5000/api";

// REGISTER NEW ACCOUNT
const registerForm = $("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = $("registerMessage");
    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim();
    const password = $("registerPassword").value;

    message.textContent = "Creating your account...";

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      message.textContent =
        "Account created successfully! Please log in.";

      registerForm.reset();

    } catch (error) {
      message.textContent = error.message;
    }
  });
}


// LOGIN EXISTING ACCOUNT
const loginForm = $("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = $("loginMessage");
    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    message.textContent = "Logging in...";

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      // Save the login information in this browser
      localStorage.setItem("exampathToken", data.token);
      localStorage.setItem(
        "exampathUser",
        JSON.stringify(data.user)
      );

      message.textContent = "Login successful! Opening dashboard...";

      window.location.href = "dashboard.html";

    } catch (error) {
      message.textContent = error.message;
    }
  });
}
