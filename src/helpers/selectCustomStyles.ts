const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#F0EFDD",
  }),

  option: (provided, state) => {
    // console.log(provided);
    return {
      ...provided,
      backgroundColor: "#F0EFDD",
      color: "black",
    };
  },
};

export default customStyles;
