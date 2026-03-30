import type { CSSObjectWithLabel } from 'react-select';

const customStyles = {
  control: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    backgroundColor: '#F0EFDD',
  }),

  option: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    backgroundColor: '#F0EFDD',
    color: 'black',
  }),

  menuPortal: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    zIndex: 20,
  }),
};

export default customStyles;
