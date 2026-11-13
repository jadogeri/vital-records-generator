const CopyrightNotice = () => {
  const currentYear = new Date().getFullYear();
  const copyrightHolder = "Orleans Parish Assessor's Office";

  return (
    <p className="copyright">
      &copy; {currentYear} {copyrightHolder}. All rights reserved.
    </p>
  );
};

export default CopyrightNotice;