import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/Toast';

describe('LoginPage Component', () => {
  it('renders login form inputs, submit button, and quick demo buttons', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LoginPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Sign In', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@apexmotors.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('populates fields when clicking quick demo admin button', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LoginPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Admin Portal');
    fireEvent.click(adminButton);

    const emailInput = screen.getByPlaceholderText('name@apexmotors.com') as HTMLInputElement;
    expect(emailInput.value).toBe('admin@apexmotors.com');
  });
});
