# Yosemite-Voluteer Your Gateway to Volunteering Opportunities
## Overview

Yosemite Volunteer is a web-based platform designed to help university students find personalized volunteer opportunities and community service projects. The platform addresses common challenges such as outdated information and a lack of tailored recommendations, offering secure and reliable real-time updates. By connecting students with organizations, VolunteerMatch simplifies the process of gaining valuable experience while contributing to the community.

**Video Demo:** https://youtu.be/evC-0NgAZlM

---

## Features

* **Real-Time Updates:** Stay informed about the latest opportunities as they are posted by verified organizations.
* **Personalized Matching:** Get suggestions based on your interests and availability.
* **Comprehensive Opportunity Database:** Access a centralized collection of volunteer opportunities and community service projects.
* **Admin Privileges:** Admins can manage organizations, post or remove opportunities, confirm or cancel applications, and more.
* **User-Friendly Experience:** Simple, intuitive interface for both students and administrators.

---

## Objectives

1. **Real-Time Updates:** Ensure students receive up-to-the-minute notifications about new volunteer opportunities.
2. **Volunteer Database:** Build a comprehensive database of volunteer opportunities and community service projects for easy access.
3. **Admin Control Panel:** Develop a secure admin portal for managing organizations, adding/removing opportunities, and moderating applications.
4. **Back-End System:** Implement a back-end system accessible only to the admin to ensure secure data handling and platform management.

---

## Why Adopt Yosemite Volunteer?

For university students, finding the right volunteer opportunities can be time-consuming and frustrating. VolunteerMatch simplifies this by offering a centralized, secure, and personalized platform that provides:

* **Convenience:** One-stop platform for all volunteer opportunities.
* **Efficiency:** Real-time updates and smart filtering save time and effort.
* **Admin Controls:** Organizations are managed by verified admins, ensuring quality and accuracy.
* **Valuable Experience:** Gain hands-on experience and make a difference in the community with ease.

---

## How to Build, Install, and Run the Application

### Prerequisites
Before installing the application, ensure you have the following:

* Node.js (v14+)
* MongoDB Atlas Account(for database)

### Installation Steps

1. **Clone the Repository**

```
git clone https://github.com/yltimon/Yosemite-Voluteer
cd Yosemite-Voluteer
```

2. **Install Dependencies**

```
npm install
```

3. **Configure Environment Variables**: Create a `.env` file in the root directory with the following content:

```
MONGODB_URI=<Your MongoDB Atlas connection string>
```

4. **Build & Run the Application**: To start the development server:


```
npm run build
npm run dev
```

Access the app on http://localhost:5000.


---

By adopting Yosemite Volunteer, university students can easily find and apply for volunteer opportunities that align with their goals and schedules. Admins can manage listings with ease, providing a smooth and trustworthy experience for all users.
