import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PaginationControls } from '../pagination-controls';

const { screen, fireEvent } = await import('@testing-library/react');

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    pageSize: 10,
    totalItems: 50,
    onPageChange: vi.fn(),
    hasNextPage: true,
    hasPrevPage: false,
  };

  it('should render pagination info', () => {
    render(<PaginationControls {...defaultProps} />);
    
    expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
  });

  it('should disable previous buttons on first page', () => {
    render(<PaginationControls {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // First two buttons are ChevronsLeft and ChevronLeft
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it('should enable next buttons when hasNextPage is true', () => {
    render(<PaginationControls {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // Last two buttons are ChevronRight and ChevronsRight
    const lastIndex = buttons.length - 1;
    expect(buttons[lastIndex]).not.toBeDisabled();
    expect(buttons[lastIndex - 1]).not.toBeDisabled();
  });

  it('should call onPageChange with previous page', () => {
    const onPageChange = vi.fn();
    
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={3}
        hasPrevPage={true}
        onPageChange={onPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // ChevronLeft button
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange with next page', () => {
    const onPageChange = vi.fn();
    
    render(
      <PaginationControls
        {...defaultProps}
        onPageChange={onPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const nextButtonIndex = buttons.length - 2; // ChevronRight is second to last
    fireEvent.click(buttons[nextButtonIndex]);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable next buttons on last page', () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={5}
        hasNextPage={false}
        hasPrevPage={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const lastIndex = buttons.length - 1;
    expect(buttons[lastIndex]).toBeDisabled();
    expect(buttons[lastIndex - 1]).toBeDisabled();
  });

  it('should show correct item range', () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={2}
        pageSize={10}
        totalItems={50}
      />
    );
    
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should go to first page when clicking first button', () => {
    const onPageChange = vi.fn();
    
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={3}
        hasPrevPage={true}
        onPageChange={onPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // ChevronsLeft button
    
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should go to last page when clicking last button', () => {
    const onPageChange = vi.fn();
    
    render(
      <PaginationControls
        {...defaultProps}
        onPageChange={onPageChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]); // ChevronsRight button
    
    expect(onPageChange).toHaveBeenCalledWith(5);
  });
});
