# Progress Pal

# Android Study Progress Tracker - Complete AI Agent Specification



## Project Overview



You are a senior Android Software Engineer, UI/UX Designer, Mobile Architect, and Product Designer.



Your task is to build a complete Android application named:



# Study Progress Tracker



The application should be production-ready, clean, modern, minimalistic, and scalable.



Generate the COMPLETE Android project and return a fully working APK.



---



# Primary Goal



This application helps university students manage their courses, lectures, labs, notes, reminders, and study progress throughout every semester.



The application must prioritize simplicity, speed, and usability.



No unnecessary animations.



Everything should be intuitive.



---



# Language



Application Language:

English only.



---



# Theme



Modern Minimal UI



Primary Colors



- White (#FFFFFF)

- Black (#000000)

- One Accent Color



Choose ONE:



Option A

Modern Blue



or



Option B

Emerald Green



Do not use more than these three colors.



Rounded cards



Soft shadows



Clean typography



Minimal icons



Material Design 3



Light Theme only.



---



# Platform



Android



Minimum SDK:

Android 9 (API 28)



Target SDK:

Latest stable.



---



# Architecture



Use clean architecture.



MVVM



Repository Pattern



Dependency Injection



Room Database



Material Design 3



Jetpack Navigation



ViewModel



LiveData or StateFlow



Coroutines



---



# Local Storage



Use Room Database.



No internet required.



Everything works offline.



---



# App Structure



Dashboard



↓



Semester List



↓



Courses



↓



Course Details



↓



Lecture Details



---



# Dashboard



Display:



Overall Study Progress %



Large Progress Circle



Total Courses



Total Lectures



Completed Lectures



Remaining Lectures



Total Labs



Completed Labs



Remaining Labs



Upcoming Reminder



Today's Tasks



Progress by Semester



Recent Activity



---



# Semester Screen



Display cards like:



Semester 1



Semester 2



Semester 3



Semester 4



Semester 5



Semester 6



Semester 7



Semester 8



Allow:



Add Semester



Rename Semester



Delete Semester



Reorder Semesters



---



# Course Screen



Inside every semester.



Each course card displays:



Course Name



Progress %



Completed Lectures



Total Lectures



Completed Labs



Total Labs



Color Progress Bar



Search Courses



Sort Courses



---



# Create/Edit Course



Fields



Course Name



Total Lectures



Total Labs



Optional Description



---



# Course Details Screen



Display



Course Name



Overall Progress



Lecture Progress



Lab Progress



Buttons



Lectures



Labs



Statistics



---



# Lectures Section



Each lecture contains:



Lecture Number



Lecture Title



Completion Status



Difficulty



Tags



Notes



Folder Path



Completion Date



Estimated Duration



---



# Labs Section



Exactly the same as lectures.



---



# Lecture Details



Fields



Lecture Number



Lecture Title



Completed (Yes/No)



Difficulty



Easy



Medium



Hard



Notes



Folder Location



Completion Date



Tags



Attachments Folder



Open Folder Button



---



# Notes Feature



Every lecture and lab has unlimited notes.



Notes support:



Multiple paragraphs



Bullet lists



Plain text



Auto-save



Edit



Delete



Search inside notes



---



# Folder Linking Feature



Instead of linking a single file...



Each lecture links to an entire folder.



Example



Semester 4/



    Algorithm Analysis/



        Lecture 03/



            Slides.pdf



            Notes.pdf



            Recording.mp4



            Assignment.pdf



The application stores ONLY the folder path.



When the user presses



Open Folder



the application opens that folder using Android's Storage Access Framework.



The folder may contain:



PDF



Videos



Images



PowerPoint



ZIP



Word



Excel



Any other files.



Do NOT copy the files.



Just open the folder.



---



# Search



Global Search



Search by:



Course Name



Lecture Name



Lab Name



Tag



Difficulty



Notes



Semester



Results should appear instantly.



---



# Tags



Every lecture and lab can have custom tags.



Default Tags:



Exam



Important



Need Revision



Assignment



Quiz



Project



Student can create unlimited custom tags.



---



# Difficulty



Each lecture/lab has exactly one difficulty.



Easy



Medium



Hard



Represent using colored chips.



---



# Progress Calculation



Course Progress



Based on:



Completed Lectures



Completed Labs



Formula



Completed Items



/



Total Items



Semester Progress



Average of all course progress.



Dashboard Progress



Average of all semester progress.



Everything updates automatically.



---



# Statistics



Display



Most Completed Course



Least Completed Course



Hardest Course



Total Notes



Total Lectures



Completed Lectures



Remaining Lectures



Completed Labs



Remaining Labs



Study Percentage



---



# Reminder System



User can create reminders.



Reminder fields:



Title



Description



Date



Time



Repeat



Options:



Never



Daily



Weekly



Monthly



Yearly



Notification



Yes



No



Use Android Notifications.



Notifications must work offline.



---



# Recent Activity



Show:



Completed Lecture



Completed Lab



Added Note



Created Reminder



Newest first.



---



# Settings



Accent Color



Blue



Green



Export Database



Import Database



Backup



Restore



About



---



# Backup



Export entire database as JSON.



Import JSON.



No cloud integration.



Everything stays offline.



---



# Database Design



Semester



- id

- name

- order



Course



- id

- semesterId

- name

- description

- totalLectures

- totalLabs



Lecture



- id

- courseId

- number

- title

- completed

- difficulty

- folderPath

- notes

- completionDate

- estimatedDuration



Lab



- id

- courseId

- number

- title

- completed

- difficulty

- folderPath

- notes

- completionDate



Tag



- id

- name



LectureTag



- lectureId

- tagId



LabTag



- labId

- tagId



Reminder



- id

- title

- description

- date

- time

- repeat

- notificationEnabled



RecentActivity



- id

- type

- title

- timestamp



---



# UX Requirements



No clutter.



Everything accessible within three taps.



Large touch targets.



Smooth scrolling.



Dark text on white background.



Rounded cards.



Consistent spacing.



Responsive layouts.



---



# Validation



Course name cannot be empty.



Lecture count cannot be negative.



Lab count cannot be negative.



Folder path must exist before saving.



Reminder date validation.



---



# Performance



Fast startup.



No UI lag.



Lazy loading where appropriate.



Efficient Room queries.



---



# Future Scalability



Design the architecture so the following features can be added later without major refactoring:



Cloud Sync



Google Drive Backup



Calendar Integration



Pomodoro Timer



Study Hours Tracking



Exam Schedule



Widgets



Multiple Languages



Desktop Version



Cross-device Sync



AI Study Assistant



---



# Deliverables



Generate:



- Complete Android Studio project

- Clean architecture

- Well-organized code

- Room database

- Material Design 3 UI

- All required icons

- Fully functional navigation

- Notification system

- Folder picker integration

- Search system

- Reminder system

- Statistics dashboard

- JSON backup/import/export

- Release-ready signed APK

- README with build instructions



The final application should feel like a polished productivity app that could be published on the Google Play Store.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mkam-study-tracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/607d8e0a-ba5f-40a9-9564-890f11899782).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
