import React from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import styles from "../../scenes/global/footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p className={styles.p}>
        StakeChain Labs &copy; 2026 — open experiment, not financial advice
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <a
          href="https://github.com/Abstract36/StakeChain"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source on GitHub"
        >
          <GitHubIcon className={styles.socialIcon} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
