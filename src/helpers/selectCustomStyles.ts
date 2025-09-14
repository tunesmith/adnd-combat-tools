type StyleObj = Record<string, unknown>;
const customStyles: {
  control: (provided: StyleObj) => StyleObj;
  option: (provided: StyleObj) => StyleObj;
} = {
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
