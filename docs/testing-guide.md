# Testing Guide

## Quick Start

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once (CI/CD)
npm run test:run

# Open Vitest UI (visual test runner)
npm run test:ui

# Generate coverage report (currently has issues with Next.js builds)
npm run test:coverage
```

## What's Already Tested

### Security (15 tests)
- **File:** `src/lib/redirect-utils.test.ts`
- **Coverage:** Open redirect vulnerability protection
- **Pattern:** Pure function testing (easiest to test)

### UI Components (13 tests)
- **File:** `src/components/admin/AdminListFilters.test.tsx`
- **Coverage:** Admin filtering interface
- **Pattern:** React component testing with mocked Radix UI

### Backend Logic (7 tests)
- **File:** `src/utils/content-management.test.ts`
- **Coverage:** Soft delete, audit logging, recovery
- **Pattern:** Async functions with Supabase + Sentry mocking

## Writing New Tests

### File Naming Convention
Place test files next to the source files:
- `src/lib/utils.ts` → `src/lib/utils.test.ts`
- `src/components/Button.tsx` → `src/components/Button.test.tsx`

### Test Structure (AAA Pattern)
```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should do something specific', () => {
    // Arrange - set up test data
    const input = 'test'

    // Act - call the function
    const result = myFunction(input)

    // Assert - verify the result
    expect(result).toBe('expected')
  })
})
```

## Testing Patterns by Complexity

### Level 1: Pure Functions (Easiest)
**Example:** `redirect-utils.test.ts`

Pure functions require no mocking:

```typescript
import { describe, it, expect } from 'vitest'
import { myPureFunction } from './my-module'

describe('myPureFunction', () => {
  it('should return expected output for given input', () => {
    expect(myPureFunction('input')).toBe('output')
  })
})
```

### Level 2: React Components (Medium)
**Example:** `AdminListFilters.test.tsx`

Mock external dependencies (Radix UI, icons):

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

// Mock complex UI libraries
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  )
}))

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Level 3: Async + Database (Hardest)
**Example:** `content-management.test.ts`

Mock Supabase client with chainable query builder:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myAsyncFunction } from './my-module'

// Create chainable mock query builder
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  // Make awaitable for operations without .single()
  then: (onFulfilled: (value: any) => any) =>
    Promise.resolve({ data: null, error: null }).then(onFulfilled)
}

const mockSupabaseClient = {
  from: vi.fn().mockReturnValue(mockQueryBuilder)
}

vi.mock('@/lib/supabase', () => ({
  createServiceRoleSupabaseClient: vi.fn(() => mockSupabaseClient)
}))

describe('myAsyncFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should query database correctly', async () => {
    // Mock the terminal operation (.single())
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { id: '123', name: 'Test' },
      error: null
    })

    const result = await myAsyncFunction('123')

    expect(result).toEqual({ id: '123', name: 'Test' })
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('my_table')
  })
})
```

## Mocking Strategies

### Mocking Next.js Modules
Already configured in `test/setup.ts`:

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))
```

### Mocking Supabase Queries

**Key insight:** Supabase uses method chaining, so mock must return `this` for non-terminal operations.

**Terminal operations** (return promises):
- `.single()` - returns single row
- `.then()` - makes builder awaitable

**Non-terminal operations** (return builder):
- `.select()`, `.update()`, `.insert()`, `.delete()`
- `.eq()`, `.is()`, `.filter()`

**Pattern:**
```typescript
// For queries that end with .single()
mockQueryBuilder.single.mockResolvedValueOnce({
  data: { id: '123' },
  error: null
})

// For queries that DON'T end with .single() (update, insert without select)
// The .then() method in mockQueryBuilder handles this automatically
```

### Mocking Sentry

```typescript
// Mock at module level
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn()
}))

// Import mocked version for assertions
import * as Sentry from '@sentry/nextjs'
const mockCaptureException = Sentry.captureException as ReturnType<typeof vi.fn>

// In test
expect(mockCaptureException).toHaveBeenCalledWith(
  error,
  expect.objectContaining({
    tags: expect.objectContaining({
      operation: 'my_operation'
    })
  })
)
```

## Common Testing Patterns

### Testing Error Handling
```typescript
it('should handle errors gracefully', async () => {
  mockQueryBuilder.single.mockResolvedValueOnce({
    data: null,
    error: new Error('Database error')
  })

  const result = await myFunction()

  expect(result.success).toBe(false)
  expect(result.error).toBeDefined()
})
```

### Testing User Interactions
```typescript
import { userEvent } from '@testing-library/user-event'

it('should call onChange when typing', async () => {
  const user = userEvent.setup()
  const mockOnChange = vi.fn()

  render(<Input onChange={mockOnChange} />)

  const input = screen.getByRole('textbox')
  await user.type(input, 'test')

  expect(mockOnChange).toHaveBeenCalled()
})
```

### Testing Audit Logging
```typescript
it('should log action without failing operation', async () => {
  // Mock operation success
  mockQueryBuilder.single.mockResolvedValueOnce({
    data: { id: '123' },
    error: null
  })

  // Mock audit log failure
  mockQueryBuilder.insert.mockImplementationOnce(() => {
    throw new Error('Audit log failed')
  })

  const result = await myFunction()

  // Operation should succeed despite audit failure
  expect(result.success).toBe(true)
  // But Sentry should be notified
  expect(mockCaptureException).toHaveBeenCalled()
})
```

## What NOT to Test

Avoid testing:
- Third-party library internals (React, Supabase, etc.)
- Next.js framework behavior
- Type definitions (TypeScript handles this)
- Obvious getters/setters
- Generated code

## Troubleshooting

### Issue: "Cannot find module '@/...'"
**Solution:** Path aliases are configured in `vitest.config.ts`. Make sure the alias matches your `tsconfig.json`.

### Issue: "Cannot access [variable] before initialization"
**Solution:** `vi.mock()` is hoisted to the top of the file. Use factory functions:
```typescript
vi.mock('@/lib/module', () => ({
  myFunction: vi.fn()
}))
```

### Issue: Mock not working across tests
**Solution:** Clear mocks in `beforeEach`:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Issue: ".single is not a function"
**Solution:** Make sure you're mocking the full Supabase query chain. The mock must return `this` for chaining methods.

### Issue: Test timeouts with async functions
**Solution:** Always `await` async operations and ensure mocks return promises:
```typescript
mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null })
// NOT: mockQueryBuilder.single.mockReturnValueOnce({ data: null, error: null })
```

## Testing Philosophy

1. **Test behavior, not implementation** - Focus on what functions do, not how they do it
2. **Keep tests simple** - Each test should verify one thing
3. **Use descriptive test names** - Name should explain what's being tested
4. **Arrange, Act, Assert** - Follow AAA pattern consistently
5. **Isolate tests** - Each test should run independently
6. **Mock external dependencies** - Don't hit real databases or APIs
7. **Test the happy path first** - Then add error cases

## Best Practices

### DO:
✅ Test public APIs and user-facing behavior
✅ Mock external dependencies (databases, APIs)
✅ Use `beforeEach` to reset mocks
✅ Write tests before fixing bugs (regression tests)
✅ Keep tests fast (< 100ms per test ideally)

### DON'T:
❌ Test private implementation details
❌ Mock everything (pure functions don't need mocks)
❌ Write tests that depend on other tests
❌ Commit tests that are flaky or skipped
❌ Test third-party library behavior

## CI/CD Integration

Tests run automatically in CI. For GitHub Actions:

```yaml
- name: Run tests
  run: npm run test:run

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Getting Help

- **Vitest docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro/
- **Our tests:** Look at existing tests for patterns
- **Ask questions:** If stuck, check with team or create GitHub issue

## Future Improvements

Things we'd like to add:
- E2E tests with Playwright
- Visual regression testing
- API integration tests with MSW
- Improve coverage reporting (currently broken with Next.js)
- Test database fixtures for integration tests
