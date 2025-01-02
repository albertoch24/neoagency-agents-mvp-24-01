export const tableTypography = {
  table: {
    width: '100%',
    tableLayout: 'auto',
    textAlign: 'left',
    marginTop: '2em',
    marginBottom: '2em',
  },
  thead: {
    borderBottomWidth: '1px',
    borderBottomColor: 'var(--tw-prose-th-borders)',
  },
  'thead th': {
    color: 'var(--tw-prose-headings)',
    fontWeight: '600',
    verticalAlign: 'bottom',
    paddingRight: '0.5714286em',
    paddingBottom: '0.5714286em',
    paddingLeft: '0.5714286em',
  },
  'thead th:first-child': {
    paddingLeft: '0',
  },
  'thead th:last-child': {
    paddingRight: '0',
  },
  'tbody tr': {
    borderBottomWidth: '1px',
    borderBottomColor: 'var(--tw-prose-td-borders)',
  },
  'tbody tr:last-child': {
    borderBottomWidth: '0',
  },
  'tbody td': {
    verticalAlign: 'baseline',
    paddingTop: '0.5714286em',
    paddingRight: '0.5714286em',
    paddingBottom: '0.5714286em',
    paddingLeft: '0.5714286em',
  },
  'tbody td:first-child': {
    paddingLeft: '0',
  },
  'tbody td:last-child': {
    paddingRight: '0',
  }
};