import type { CSSObjectWithLabel } from 'react-select';

interface SelectOptionState {
  isFocused: boolean;
  isSelected: boolean;
}

const customStyles = {
  control: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    backgroundColor: '#F0EFDD',
  }),

  menu: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    zIndex: 9999,
  }),

  option: (
    provided: CSSObjectWithLabel,
    state: SelectOptionState
  ): CSSObjectWithLabel => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'rgba(84, 111, 58, 0.26)'
      : state.isFocused
      ? 'rgba(175, 127, 0, 0.18)'
      : '#F0EFDD',
    color: 'black',
    fontWeight: state.isSelected ? 700 : provided.fontWeight,
  }),

  menuPortal: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    zIndex: 9999,
  }),
};

export default customStyles;
