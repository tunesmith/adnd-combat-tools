import Link from "next/link";
import styles from "./index.module.css";

const Index = () => {
  return (
    <div className={styles["links"]}>
      <Link href={"/calculator"}>AD&D Combat Calculator</Link>
      <br />
      <Link href={"/battle"}>AD&D Battle Grid</Link>
    </div>
  );
};

export default Index;
