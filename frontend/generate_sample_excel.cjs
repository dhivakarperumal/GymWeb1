const XLSX = require('xlsx');
const path = require('path');

const data = [
  {
    "MemberId": "101",
    "MemberName": "John Doe",
    "Level": "Beginner",
    "Category": "Cardio",
    "Goal": "Weight Loss",
    "Duration (Weeks)": 4
  },
  {
    "MemberId": "102",
    "MemberName": "Jane Smith",
    "Level": "Intermediate",
    "Category": "Weight Training",
    "Goal": "Muscle Gain",
    "Duration (Weeks)": 8
  },
  {
    "MemberId": "103",
    "MemberName": "Mike Ross",
    "Level": "Advanced",
    "Category": "HIIT",
    "Goal": "Endurance",
    "Duration (Weeks)": 12
  },
  {
    "MemberId": "104",
    "MemberName": "Sarah Connor",
    "Level": "Beginner",
    "Category": "Yoga / Stretching",
    "Goal": "Flexibility",
    "Duration (Weeks)": 6
  },
  {
    "MemberId": "105",
    "MemberName": "Bruce Wayne",
    "Level": "Advanced",
    "Category": "Bodyweight",
    "Goal": "Strength",
    "Duration (Weeks)": 10
  },
  {
    "MemberId": "106",
    "MemberName": "Clark Kent",
    "Level": "Intermediate",
    "Category": "Weight Training",
    "Goal": "Hypertrophy",
    "Duration (Weeks)": 12
  },
  {
    "MemberId": "107",
    "MemberName": "Diana Prince",
    "Level": "Advanced",
    "Category": "HIIT",
    "Goal": "Agility",
    "Duration (Weeks)": 8
  },
  {
    "MemberId": "108",
    "MemberName": "Barry Allen",
    "Level": "Beginner",
    "Category": "Cardio",
    "Goal": "Speed",
    "Duration (Weeks)": 4
  },
  {
    "MemberId": "109",
    "MemberName": "Tony Stark",
    "Level": "Intermediate",
    "Category": "Weight Training",
    "Goal": "Iron Physique",
    "Duration (Weeks)": 12
  },
  {
    "MemberId": "110",
    "MemberName": "Peter Parker",
    "Level": "Beginner",
    "Category": "Bodyweight",
    "Goal": "Balance",
    "Duration (Weeks)": 8
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Workouts");

const filePath = path.join(process.cwd(), 'workout_import_sample.xlsx');
XLSX.writeFile(workbook, filePath);

console.log('Sample Excel file created at:', filePath);
