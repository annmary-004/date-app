import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

describe('Register page', () => {
  it('renders the login-style auth layout', () => {
    render(
      <MemoryRouter>
        <Register setUser={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(document.querySelector('.auth-animated-page')).toBeInTheDocument();
    expect(document.querySelector('.auth-glass-container')).toBeInTheDocument();
    expect(document.querySelector('.glass-form')).toBeInTheDocument();
  });
});
