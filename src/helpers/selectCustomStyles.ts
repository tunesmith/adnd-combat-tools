import type { CSSObjectWithLabel } from 'react-select';

const customStyles = {
  control: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    backgroundColor: '#F0EFDD',
  }),

  menu: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    zIndex: 9999,
  }),

  option: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    backgroundColor: '#F0EFDD',
    color: 'black',
  }),

  menuPortal: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    zIndex: 9999,
  }),
};

export default customStyles;
