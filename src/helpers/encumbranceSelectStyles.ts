import type { GroupBase, StylesConfig } from 'react-select';

export type EncumbranceSelectValue = string | number;

export interface EncumbranceSelectOption<
  T extends EncumbranceSelectValue = EncumbranceSelectValue
> {
  value: T;
  label: string;
  isDisabled?: boolean;
}

export const createEncumbranceSelectStyles = <
  T extends EncumbranceSelectValue = EncumbranceSelectValue
>(): StylesConfig<
  EncumbranceSelectOption<T>,
  false,
  GroupBase<EncumbranceSelectOption<T>>
> => ({
  container: (provided) => ({
    ...provided,
    width: '100%',
  }),
  control: (provided, state) => ({
    ...provided,
    minHeight: '2.45rem',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: state.isFocused
      ? 'rgba(212, 141, 39, 1)'
      : 'rgba(212, 141, 39, 0.85)',
    background: 'rgba(240, 239, 221, 0.97)',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'rgba(212, 141, 39, 1)',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0.34rem 0.65rem',
    gap: 0,
  }),
  singleValue: (provided) => ({
    ...provided,
    margin: 0,
    color: 'var(--caput-martuum)',
    fontFamily: 'Sura, Georgia, serif',
    fontSize: '1rem',
    lineHeight: 1.15,
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    color: 'var(--caput-martuum)',
    fontFamily: 'Sura, Georgia, serif',
    fontSize: '1rem',
    lineHeight: 1.15,
  }),
  placeholder: (provided) => ({
    ...provided,
    margin: 0,
    color: 'rgba(83, 50, 47, 0.55)',
    fontFamily: 'Sura, Georgia, serif',
    fontSize: '1rem',
    lineHeight: 1.15,
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    padding: '0 0.75rem 0 0.35rem',
    color: state.isFocused ? 'var(--caput-martuum)' : 'rgba(83, 50, 47, 0.82)',
    '&:hover': {
      color: 'var(--caput-martuum)',
    },
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 45,
  }),
  menu: (provided) => ({
    ...provided,
    overflow: 'hidden',
    border: '1px solid rgba(212, 141, 39, 0.7)',
    borderRadius: 12,
    background: 'rgba(240, 239, 221, 0.99)',
    boxShadow: '0 0.9rem 1.8rem rgba(0, 0, 0, 0.24)',
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '0.28rem',
  }),
  groupHeading: (provided) => ({
    ...provided,
    marginBottom: '0.18rem',
    padding: '0.2rem 0.5rem',
    color: 'rgba(83, 50, 47, 0.62)',
    fontSize: '0.74rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }),
  option: (provided, state) => ({
    ...provided,
    padding: '0.55rem 0.8rem',
    borderRadius: 10,
    color: state.isSelected ? '#fff9ec' : 'var(--caput-martuum)',
    backgroundColor: state.isSelected
      ? 'var(--dark-olive-green)'
      : state.isFocused
      ? 'rgba(104, 132, 66, 0.16)'
      : 'transparent',
    fontFamily: 'Poppins, sans-serif',
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.25,
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
  }),
});
