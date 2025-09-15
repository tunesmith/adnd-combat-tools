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
};

export default customStyles;
