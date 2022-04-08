const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#F0EFDD",
  }),

  option: (provided) => {
    // console.log(provided);
    return {
      ...provided,
      backgroundColor: "#F0EFDD",
      color: "black",
    };
  },
};

export default customStyles;
