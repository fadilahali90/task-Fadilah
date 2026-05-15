## 🧠 Framework Overview
This automation framework is built using Playwright with TypeScript.

#  Project Structure
```bash
task-Fadilah/
│
├── page-objects/           # Page Object classes
│   └── manageStaff-page.ts
│
├── tests/                  # Test scripts & test data (JSON file)
│
├── test-results/           # Playwright test results (failure screenshot)
│
├── playwright-report/      # HTML execution reports
│
├── manageStaff.xlsx        # testcases file
│
├── playwright.config.ts    # Playwright configuration
├── package.json            # Project dependencies & scripts
├── package-lock.json
├── tsconfig.json           # TypeScript configuration
└── README.md

---

## ⚙️ Prerequisites & Setup

Before running this project, ensure the following are installed:
- Node.js (LTS): https://nodejs.org/
- Git: https://git-scm.com/

Verify installation:
node -v
npm -v
git --version

---

## 🚀 Project Setup & Run

# clone repository
git clone https://github.com/fadilahali90/task-Fadilah.git

# enter project folder
cd task-Fadilah

# install dependencies
npm ci

# install Playwright browsers
npx playwright install

# set environment variables (Windows CMD)
set USERNAME=<email@example.com>
set PASSWORD=<password>

# run tests (headed mode)
npx playwright test 

# run tests (headless mode)
npx playwright test --headless

# run specific test file
npx playwright test tests/example.spec.ts

# open Playwright HTML report
npx playwright show-report

---

## 👩‍💻 Author

Developed by Fadilah Ali using Playwright + TypeScript