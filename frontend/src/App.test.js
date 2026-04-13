import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

test('renders navbar logo', () => {
  render(
    <BrowserRouter>
       <AuthProvider>
          <Navbar />
       </AuthProvider>
    </BrowserRouter>
  );
  const logoElement = screen.getByText(/SmartPark/i);
  expect(logoElement).toBeInTheDocument();
});
