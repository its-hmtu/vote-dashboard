import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message, Alert } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { auth, signInWithEmailAndPassword, onAuthStateChanged } from "../../firebase";
import { PATH } from "../../constants/PATH"

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shakeForm, setShakeForm] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(PATH.DASHBOARD);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null); // Clear any previous errors
    setShakeForm(false); // Reset shake animation
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Login successful!");
      navigate(PATH.DASHBOARD);
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No user found with this email address.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "auth/invalid-credential": 
          errorMessage = "Invalid login credentials. Please check your email and password.";
          break;
        default:
          break;
      }
      
      // Set error state and trigger shake animation
      setError(errorMessage);
      setShakeForm(true);
      
      // Clear shake animation after it completes
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <Card 
        className={`w-full max-w-md shadow-lg animate-fadeIn transition-all duration-300 ${error ? 'shadow-red-200 border-red-200' : 'hover:shadow-xl'}`}
        title={
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Vote Dashboard
            </h1>
            <p className="text-gray-600 text-sm">
              Sign in to access your dashboard
            </p>
          </div>
        }
      >
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
          requiredMark={false}
          className={shakeForm ? "animate-shake" : ""}
        >
          {/* Animated Error Alert */}
          {error && (
            <div className="mb-4">
              <Alert
                message={error}
                type="error"
                icon={<ExclamationCircleOutlined />}
                closable
                onClose={() => setError(null)}
                className="animate-slideInDown error-alert border-red-300 bg-red-50 shadow-sm"
              />
            </div>
          )}

          <Form.Item
            name="email"
            label="Email"
            rules={[
              {
                required: true,
                message: "Please input your email!",
              },
              {
                type: "email",
                message: "Please enter a valid email address!",
              },
            ]}
          >
            <Input
              placeholder="Enter your email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
              {
                min: 6,
                message: "Password must be at least 6 characters!",
              },
            ]}
          >
            <Input.Password
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className={`w-full transition-all duration-200 ${loading ? 'transform scale-95' : 'hover:transform hover:scale-105'}`}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
