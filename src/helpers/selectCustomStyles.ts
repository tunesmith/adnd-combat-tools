const customStyles: {
  control: (provided: any) => any;
  option: (provided: any) => any;
  menuPortal: (provided: any) => any;
} = {
  control: (provided) => ({
    ...provided,
    backgroundColor: '#F0EFDD',
  }),

  option: (provided) => {
    // console.log(provided);
    return {
      ...provided,
      backgroundColor: '#F0EFDD',
      color: 'black',
    };
  },

  menuPortal: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
};

export default customStyles;
