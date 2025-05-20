<div align="center">
  <img src="https://github.com/user-attachments/assets/1e16275b-96c6-4664-bbf4-4e8aad56a578" alt="Trackify" width="200">
</div>

<h1 align="center">🎯 Trackify - Smart Price Tracking Application</h1>

<p align="center">🚀 Track prices across e-commerce platforms and get notified when prices drop to your desired level</p>

## ✨ Features

<div align="center">

- **User Authentication**: Secure signup and login system
- **Product Tracking**: Add and monitor products from various e-commerce platforms
- **Price History**: View detailed price history graphs for tracked products
- **Smart Alerts**: Set custom price alerts and receive email notifications
- **Dashboard**: Intuitive dashboard to manage all tracked products
- **Product Management**: Add, view, and manage product details easily
- **Email Notifications**: Automated email alerts when prices drop below target

</div>

## 🛠️ Tech Stack

<div align="center">

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Styling**: Tailwind CSS
- **Charts**: Chart.js for price history visualization
- **Email Service**: SendGrid for notifications

</div>

## 📸 Screenshots

<div align="center">

### Dashboard
<img src="https://github.com/user-attachments/assets/dfbae886-8043-4380-b993-615305100b07" alt="Dashboard" width="800">

### Adding new product
<img src="https://github.com/user-attachments/assets/055f9500-99bc-4c7f-bebc-3d120587720b" alt="Add Product" width="800">

### Product Details
<img src="https://github.com/user-attachments/assets/dbf61bf6-2cff-422d-8190-9e92815581f5" alt="Product Details" width="800">

### Product History
<img src="https://github.com/user-attachments/assets/8060e14a-cc7a-4788-a1e5-26f413c72b86" alt="Product History" width="800">

### Alerts Page
<img src="https://github.com/user-attachments/assets/e40f35b3-1fb5-4db8-83c3-b47841a9bfba" alt="Alerts" width="800">

### Email Notification
<img src="https://github.com/user-attachments/assets/bcdbbf38-1fd1-4140-9ba0-e91815b2bc22" alt="Email Notification" width="800">

### Settings
<img src="https://github.com/user-attachments/assets/1cb7b560-012a-412d-b353-4ac958a42165" alt="Settings" width="800">

</div>

## 🔧 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/trackify.git
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# Backend .env
PORT=5000
MONGO_URI=your_mongodb_uri
MONGOJWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_api_key
GEMINI_API_KEY=your_gemini_api_key

EMAIL_FROM=your_verified_sendgrid_email

# Frontend .env
VITE_API_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Run the application
```bash
# Run backend 
cd backend
npm run dev

# Run frontend
cd frontend
npm start
```

## 📖 Usage

<div align="center">

1. Create an account or login
2. Add products you want to track by pasting their URLs
3. Set your desired price for alerts
4. View price history and trends in the dashboard
5. Receive email notifications when prices drop below your target

</div>

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📫 Contact

<div align="center">

Vicke - itsvicke6531@gmail.com

Project Link: [https://github.com/Vicke413/Trackify](https://github.com/Vicke413/Trackify)

</div>
