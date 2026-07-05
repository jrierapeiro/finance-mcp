# Testing Requirements

All new features must include appropriate unit and integration tests to ensure quality and prevent regressions.

## Unit Tests

Every new function or module must have unit tests that verify:
- Function exists and is callable
- Correct handling of valid inputs
- Proper error handling for invalid inputs
- Edge cases and boundary conditions
- Return value structure matches expected format
- Performance characteristics (where applicable)

## Integration Tests

All new features must include integration tests that verify:
- End-to-end functionality within the application context
- Compatibility with existing system components
- Proper interaction with external dependencies
- Server capability to process new functionality

## Test Standards

- Tests should be written using the existing test framework (Vitest)
- All tests should be runnable without manual setup or special configuration
- Test files should be placed in the `test/` directory following existing patterns
- Test coverage should be comprehensive but not overkill
- Mocking of external dependencies should be implemented properly 
- Tests must not rely on network calls for unit tests when possible

## Special Considerations

When external modules like YahooFinance are difficult to mock:
- Document the limitation in task completion notes
- Provide integration test coverage instead  
- Show that the core functionality works in the broader system context

This standard applies to all future features and modifications.