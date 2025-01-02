import { baseTypography } from './typography/base';
import { listTypography } from './typography/lists';
import { headingTypography } from './typography/headings';
import { blockTypography } from './typography/blocks';
import { codeTypography } from './typography/code';
import { tableTypography } from './typography/tables';

export const typography = {
  DEFAULT: {
    css: {
      ...baseTypography,
      ...listTypography,
      ...headingTypography,
      ...blockTypography,
      ...codeTypography,
      ...tableTypography,
    },
  },
};