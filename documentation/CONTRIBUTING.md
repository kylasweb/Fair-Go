# FairGo Platform - Contributing Guidelines

## Welcome Contributors!

Thank you for your interest in contributing to the FairGo platform. This guide will help you get started with contributing to our taxi booking platform built with Next.js, TypeScript, and modern web technologies.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Guidelines](#documentation-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community and Communication](#community-and-communication)

## Code of Conduct

### Our Pledge

We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

Before contributing, make sure you have:

- **Node.js 18+ LTS** installed
- **PostgreSQL 14+** for database development
- **Git** for version control
- **Code editor** (VS Code recommended)
- Basic knowledge of TypeScript, React, and Next.js

### Development Setup

1. **Fork the Repository**

   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/fairgo-platform.git
   cd fairgo-platform
   ```

2. **Set Up Remote**

   ```bash
   # Add the original repo as upstream
   git remote add upstream https://github.com/fairgo-official/fairgo-platform.git
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

5. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # Seed test data (optional)
   npx prisma db seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

### Project Familiarization

Before making changes, please:

- Read the [Developer Guide](./DEVELOPER_GUIDE.md)
- Review the [API Documentation](./API_DOCUMENTATION.md)
- Explore the codebase structure
- Run the test suite: `npm test`
- Try the application locally

## Development Workflow

### Branch Strategy

We use **GitHub Flow** with feature branches:

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# Work on your feature
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Branch Naming Convention

- **Features**: `feature/short-description`
- **Bug fixes**: `fix/bug-description`
- **Documentation**: `docs/update-description`
- **Refactoring**: `refactor/component-name`
- **Testing**: `test/test-description`

Examples:

```bash
feature/booking-cancellation
fix/payment-validation-error
docs/update-api-documentation
refactor/auth-components
test/booking-integration-tests
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Update your main branch
git checkout main
git merge upstream/main
git push origin main

# Rebase your feature branch (if needed)
git checkout feature/your-feature-name
git rebase main
```

## Coding Standards

### TypeScript Standards

- **Strict Mode**: All TypeScript must compile in strict mode
- **Type Safety**: Avoid `any` types; use proper typing
- **Interfaces**: Define interfaces for all data structures
- **Enums**: Use enums for constants with multiple values

```typescript
// ✅ Good
interface BookingRequest {
  pickupLocation: LocationCoordinates;
  dropoffLocation: LocationCoordinates;
  vehicleType: VehicleType;
  scheduledAt?: Date;
}

enum VehicleType {
  ECONOMY = "ECONOMY",
  COMFORT = "COMFORT",
  PREMIUM = "PREMIUM",
}

// ❌ Avoid
function createBooking(data: any) {
  // Missing type safety
}
```

### React Component Standards

- **Functional Components**: Use function components with hooks
- **Props Interface**: Define props interfaces for all components
- **Default Props**: Use default parameters instead of defaultProps
- **Memo**: Use React.memo for expensive components

```typescript
// ✅ Good
interface BookingCardProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  showActions?: boolean;
}

export const BookingCard = React.memo(
  ({ booking, onCancel, showActions = true }: BookingCardProps) => {
    // Component implementation
  }
);

// ❌ Avoid
export function BookingCard(props: any) {
  // Missing type safety and optimization
}
```

### File Naming Convention

- **Components**: PascalCase (`BookingCard.tsx`)
- **Utilities**: camelCase (`authUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Hooks**: camelCase with `use` prefix (`useBooking.ts`)

### Code Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── features/        # Feature-specific components
│   └── layouts/         # Layout components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── store/               # State management
├── types/               # TypeScript type definitions
└── utils/               # General utility functions
```

### CSS and Styling

- **Tailwind CSS**: Primary styling framework
- **CSS Modules**: For component-specific styles (when needed)
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Follow WCAG guidelines

```typescript
// ✅ Good - Using Tailwind classes
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
  Book Ride
</button>

// ✅ Good - Custom CSS with CSS modules
<div className={styles.bookingCard}>
  {/* Component content */}
</div>
```

### Error Handling

- **Try-Catch**: Wrap async operations
- **Error Boundaries**: Implement for component error handling
- **User-Friendly Messages**: Show meaningful error messages
- **Logging**: Log errors for debugging

```typescript
// ✅ Good error handling
async function createBooking(data: BookingRequest) {
  try {
    const response = await api.post("/api/bookings", data);
    return response.data;
  } catch (error) {
    console.error("Booking creation failed:", error);

    if (error instanceof ValidationError) {
      throw new Error("Please check your booking details and try again.");
    }

    throw new Error("Unable to create booking. Please try again later.");
  }
}
```

## Testing Requirements

### Test Coverage

All contributions must include appropriate tests:

- **Unit Tests**: For utility functions and individual components
- **Integration Tests**: For API routes and complex workflows
- **End-to-End Tests**: For critical user journeys

### Testing Standards

```typescript
// Unit test example
describe("calculateFare", () => {
  it("calculates basic fare correctly", () => {
    const fare = calculateFare(5.0, VehicleType.ECONOMY, 1.0);
    expect(fare).toBe(12.5);
  });

  it("handles edge cases", () => {
    expect(() => calculateFare(-1, VehicleType.ECONOMY, 1.0)).toThrow(
      "Distance must be positive"
    );
  });
});

// Component test example
describe("BookingCard", () => {
  it("renders booking information correctly", () => {
    const mockBooking = createMockBooking();
    render(<BookingCard booking={mockBooking} />);

    expect(
      screen.getByText(mockBooking.pickupLocation.address)
    ).toBeInTheDocument();
    expect(screen.getByText(`$${mockBooking.finalFare}`)).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const mockBooking = createMockBooking();
    const onCancel = jest.fn();

    render(<BookingCard booking={mockBooking} onCancel={onCancel} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledWith(mockBooking.id);
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e

# Run specific test file
npm test -- BookingCard.test.tsx
```

## Documentation Guidelines

### Code Documentation

- **JSDoc**: Document all public functions and complex logic
- **README**: Update relevant README files
- **API Documentation**: Update OpenAPI specs for API changes
- **Type Documentation**: Document complex TypeScript interfaces

```typescript
/**
 * Calculates the estimated fare for a ride based on distance, vehicle type, and surge multiplier.
 *
 * @param distance - Distance in kilometers
 * @param vehicleType - Type of vehicle (ECONOMY, COMFORT, PREMIUM)
 * @param surgeMultiplier - Surge pricing multiplier (1.0 = no surge)
 * @returns Estimated fare in dollars
 *
 * @example
 * const fare = calculateFare(5.2, VehicleType.ECONOMY, 1.5)
 * console.log(fare) // 18.75
 */
export function calculateFare(
  distance: number,
  vehicleType: VehicleType,
  surgeMultiplier: number = 1.0
): number {
  // Implementation
}
```

### Documentation Updates

When making changes, update:

- **API Documentation**: For API endpoint changes
- **Developer Guide**: For architectural changes
- **User Guide**: For user-facing features
- **README**: For setup or workflow changes

## Pull Request Process

### Before Submitting

1. **Self Review**: Review your own code first
2. **Tests Pass**: Ensure all tests pass locally
3. **Lint Check**: Run ESLint and fix all issues
4. **Type Check**: Ensure TypeScript compilation succeeds
5. **Documentation**: Update relevant documentation

```bash
# Pre-submission checklist
npm run lint
npm run type-check
npm test
npm run build
```

### Pull Request Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Pull Request Guidelines

1. **Small, Focused Changes**: Keep PRs small and focused on a single feature/fix
2. **Clear Description**: Explain what you changed and why
3. **Link Issues**: Reference related issues (`Fixes #123`)
4. **Screenshots**: Include screenshots for UI changes
5. **Breaking Changes**: Clearly mark and explain breaking changes

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one maintainer review required
3. **Testing**: Reviewers may request additional testing
4. **Documentation**: Ensure documentation is adequate
5. **Approval**: PR needs approval before merging

### After Review

- **Address Feedback**: Make requested changes promptly
- **Re-request Review**: After making changes
- **Squash Commits**: May be required before merging
- **Celebrate**: Your contribution is live! 🎉

## Issue Guidelines

### Bug Reports

When reporting bugs, include:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

For feature requests, include:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Issue Labels

- **bug**: Something isn't working
- **enhancement**: New feature or request
- **documentation**: Improvements or additions to documentation
- **good first issue**: Good for newcomers
- **help wanted**: Extra attention is needed
- **question**: Further information is requested
- **wontfix**: This will not be worked on

## Community and Communication

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat
- **Email**: security@fairgo.com for security issues

### Getting Help

1. **Search Existing Issues**: Check if your question has been asked
2. **Read Documentation**: Check our comprehensive guides
3. **Ask in Discussions**: For general questions
4. **Join Discord**: For real-time help

### Mentorship Program

We offer mentorship for new contributors:

- **First-time Contributors**: We'll help you get started
- **Pairing Sessions**: Work with experienced contributors
- **Code Reviews**: Learn through detailed feedback
- **Office Hours**: Regular Q&A sessions

### Recognition

We recognize contributors through:

- **Contributors Page**: Featured on our website
- **GitHub Recognition**: Highlighted in release notes
- **Swag**: Contributors receive FairGo merchandise
- **References**: LinkedIn recommendations for significant contributors

## Security Issues

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please report security issues to: security@fairgo.com

Include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, XSS, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## License

By contributing to FairGo, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

Don't hesitate to ask! We're here to help:

- Open a discussion on GitHub
- Join our Discord community
- Email us at contributors@fairgo.com

Thank you for contributing to FairGo! 🚀
