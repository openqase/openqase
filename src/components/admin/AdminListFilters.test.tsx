import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AdminListFilters, type FilterConfig } from './AdminListFilters'

// Mock Radix UI Select components
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-wrapper">
      <button onClick={() => onValueChange?.('test-value')}>
        {value || 'Select'}
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <button data-value={value}>{children}</button>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}))

// Mock Input component
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}))

// Mock lucide-react icon
vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />
}))

describe('AdminListFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    filters: [] as FilterConfig[],
    resultCount: 0,
    totalCount: 0,
    itemName: 'items'
  }

  describe('Search input', () => {
    it('should render search input with placeholder', () => {
      render(
        <AdminListFilters
          {...defaultProps}
          searchPlaceholder="Search algorithms..."
        />
      )

      expect(screen.getByPlaceholderText('Search algorithms...')).toBeInTheDocument()
    })

    it('should render search icon', () => {
      render(<AdminListFilters {...defaultProps} />)
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    it('should call onSearchChange when typing', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <AdminListFilters
          {...defaultProps}
          onSearchChange={mockOnChange}
          searchPlaceholder="Search..."
        />
      )

      const input = screen.getByPlaceholderText('Search...')
      await user.type(input, 'test query')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should display current search query value', () => {
      render(
        <AdminListFilters
          {...defaultProps}
          searchQuery="quantum"
          searchPlaceholder="Search..."
        />
      )

      expect(screen.getByPlaceholderText('Search...')).toHaveValue('quantum')
    })
  })

  describe('Filter dropdowns', () => {
    it('should render no filters when filters array is empty', () => {
      render(<AdminListFilters {...defaultProps} filters={[]} />)
      expect(screen.queryByTestId('select-wrapper')).not.toBeInTheDocument()
    })

    it('should render single filter dropdown', () => {
      const filters: FilterConfig[] = [
        {
          key: 'status',
          label: 'Status',
          value: 'all',
          onChange: vi.fn(),
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'published', label: 'Published' }
          ]
        }
      ]

      render(<AdminListFilters {...defaultProps} filters={filters} />)
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render multiple filter dropdowns', () => {
      const filters: FilterConfig[] = [
        {
          key: 'status',
          label: 'Status',
          value: 'all',
          onChange: vi.fn(),
          options: [{ value: 'all', label: 'All Status' }]
        },
        {
          key: 'batch',
          label: 'Batch',
          value: 'all',
          onChange: vi.fn(),
          options: [{ value: 'all', label: 'All Batches' }]
        }
      ]

      render(<AdminListFilters {...defaultProps} filters={filters} />)
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Batch')).toBeInTheDocument()
    })

    it('should call onChange when filter value changes', async () => {
      const mockOnChange = vi.fn()
      const filters: FilterConfig[] = [
        {
          key: 'status',
          label: 'Status',
          value: 'all',
          onChange: mockOnChange,
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'published', label: 'Published' }
          ]
        }
      ]

      render(<AdminListFilters {...defaultProps} filters={filters} />)

      // Simulate filter change (mocked behavior)
      const button = screen.getByText('all')
      await userEvent.setup().click(button)

      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Result count display', () => {
    it('should display correct result count', () => {
      render(
        <AdminListFilters
          {...defaultProps}
          resultCount={5}
          totalCount={10}
          itemName="case studies"
        />
      )

      expect(screen.getByText('Showing 5 of 10 case studies')).toBeInTheDocument()
    })

    it('should handle zero results', () => {
      render(
        <AdminListFilters
          {...defaultProps}
          resultCount={0}
          totalCount={10}
          itemName="algorithms"
        />
      )

      expect(screen.getByText('Showing 0 of 10 algorithms')).toBeInTheDocument()
    })

    it('should handle all results showing', () => {
      render(
        <AdminListFilters
          {...defaultProps}
          resultCount={10}
          totalCount={10}
          itemName="items"
        />
      )

      expect(screen.getByText('Showing 10 of 10 items')).toBeInTheDocument()
    })
  })

  describe('Layout and styling', () => {
    it('should render filter bar container', () => {
      const { container } = render(<AdminListFilters {...defaultProps} />)

      // Check for filter bar with correct classes
      const filterBar = container.querySelector('.mb-6.p-4.bg-card.rounded-lg.border')
      expect(filterBar).toBeInTheDocument()
    })

    it('should use responsive flexbox layout', () => {
      const { container } = render(<AdminListFilters {...defaultProps} />)

      // Check for responsive flex container
      const flexContainer = container.querySelector('.flex.flex-col.sm\\:flex-row.gap-4')
      expect(flexContainer).toBeInTheDocument()
    })
  })
})
