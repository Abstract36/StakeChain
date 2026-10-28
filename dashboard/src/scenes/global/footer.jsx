import React from "react";
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import styles from '../../scenes/global/footer.module.css'; // Import the CSS module

const Footer = () => {
  return (
    <footer className={styles.footer}>
        <p className={styles.p}>Stakechain &copy; 2024</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <TwitterIcon className={styles.socialIcon} />
        </a>
        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
          <LinkedInIcon className={styles.socialIcon} />
        </a>
        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
          <TelegramIcon className={styles.socialIcon} /></a>
        <a href="https://gitbook.com" target="_blank" rel="noopener noreferrer">
          <MenuBookIcon className={styles.socialIcon} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
