import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

// 🎨 Premium PDF Styles (ATS Friendly)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // Distinct Header Styling
  headerBox: {
    borderBottomWidth: 2,
    borderBottomColor: "#10b981", // MintCV Emerald Accent
    paddingBottom: 15,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "bold",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 10,
  },
  contactItem: {
    fontSize: 10,
    color: "#475569",
  },
  link: {
    color: "#10b981",
    textDecoration: "none",
  },
  // Section Styling
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginTop: 15,
    marginBottom: 8,
  },
  normalText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },
  boldText: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  block: {
    marginBottom: 10,
  },
});

const ResumePDF = ({ data, settings }) => {
  // Agar Preview page se sliders ghumaye, toh unki value aayegi.
  // Agar normal Builder view hai, toh default (10pt, 1.5x) lagega.
  const baseFontSize = settings?.baseFontSize || 10;
  const lineH = settings?.lineHeight || 1.5;
  const gap = settings?.sectionSpacing || 15;

  // Real-time CSS based on sliders
  const dynamicStyles = {
    name: { fontSize: baseFontSize + 14 }, // 24pt relative
    title: { fontSize: baseFontSize + 4 },
    contact: { fontSize: baseFontSize - 1 },
    sectionHeading: { fontSize: baseFontSize + 2, marginTop: gap }, // 🌟 Section gap magic!
    text: { fontSize: baseFontSize, lineHeight: lineH }, // 🌟 Line Height magic!
  };
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* DISTINCT HEADER */}
        <View style={styles.headerBox}>
          <Text style={[styles.name, dynamicStyles.name]}>
            {data.personalInfo?.fullName || "Your Name"}
          </Text>
          {data.professionalTitle && (
            <Text style={styles.title}>{data.professionalTitle}</Text>
          )}

          <View style={styles.contactRow}>
            {data.personalInfo?.email && (
              <Text style={styles.contactItem}>{data.personalInfo.email}</Text>
            )}
            {data.personalInfo?.phone && (
              <Text style={styles.contactItem}>
                • {data.personalInfo.phone}
              </Text>
            )}
            {data.personalInfo?.location && (
              <Text style={styles.contactItem}>
                • {data.personalInfo.location}
              </Text>
            )}
            {data.personalInfo?.linkedinUrl && (
              <Link
                src={data.personalInfo.linkedinUrl}
                style={styles.contactItem}
              >
                • LinkedIn
              </Link>
            )}
            {data.personalInfo?.githubUrl && (
              <Link
                src={data.personalInfo.githubUrl}
                style={styles.contactItem}
              >
                • GitHub
              </Link>
            )}
            {data.personalInfo?.portfolioUrl && (
              <Link
                src={data.personalInfo.portfolioUrl}
                style={styles.contactItem}
              >
                • Portfolio
              </Link>
            )}
          </View>
        </View>

        {/* SUMMARY */}
        {data.summary && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Professional Summary
            </Text>
            <Text style={[styles.normalText, dynamicStyles.text]}>
              {data.summary}
            </Text>
          </View>
        )}

        {/* SKILLS */}
        {data.skills && data.skills.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Technical Skills
            </Text>
            <Text style={[styles.normalText, dynamicStyles.text]}>
              {Array.isArray(data.skills)
                ? data.skills.join(" • ")
                : data.skills}
            </Text>
          </View>
        )}

        {/* EXPERIENCE */}
        {data.experience && data.experience.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Experience
            </Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={styles.block}>
                <View style={styles.itemRow}>
                  <Text
                    style={[
                      styles.normalText,
                      styles.boldText,
                      dynamicStyles.text,
                    ]}
                  >
                    {exp.position}
                  </Text>
                  <Text style={[styles.normalText, dynamicStyles.text]}>
                    {exp.startDate} - {exp.endDate || "Present"}
                  </Text>
                </View>
                <Text style={[styles.normalText, dynamicStyles.text]}>
                  {exp.company}
                </Text>
                {exp.description && (
                  <Text
                    style={[
                      styles.normalText,
                      dynamicStyles.text,
                      { marginTop: 4 },
                    ]}
                  >
                    {exp.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* PROJECTS */}
        {data.projects && data.projects.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Projects
            </Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={styles.block}>
                <View style={styles.itemRow}>
                  <Text
                    style={[
                      styles.normalText,
                      styles.boldText,
                      dynamicStyles.text,
                    ]}
                  >
                    {proj.title} {proj.techStack ? `| ${proj.techStack}` : ""}
                  </Text>
                  {proj.link && (
                    <Link
                      src={proj.link}
                      style={[styles.normalText, styles.link]}
                    >
                      View Project
                    </Link>
                  )}
                </View>
                {proj.description && (
                  <Text style={{ ...styles.normalText, marginTop: 4 }}>
                    {proj.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* EDUCATION */}
        {data.education && data.education.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Education
            </Text>
            {data.education.map((edu, i) => (
              <View key={i} style={styles.block}>
                <View style={styles.itemRow}>
                  <Text
                    style={[
                      styles.normalText,
                      styles.boldText,
                      dynamicStyles.text,
                    ]}
                  >
                    {edu.degree}
                  </Text>
                  <Text style={[styles.normalText, dynamicStyles.text]}>
                    {edu.startDate} - {edu.endDate}
                  </Text>
                </View>
                <Text style={[styles.normalText, dynamicStyles.text]}>
                  {edu.institution} {edu.grade ? ` | Grade: ${edu.grade}` : ""}
                </Text>

                {/* 🌟 YE RAHI WO LINE JO PRINT NAHI HO RAHI THI */}
                {edu.description && (
                  <Text style={[styles.normalText, dynamicStyles.text, { marginTop: 3, color: "#334155" }]}>
                    {edu.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CERTIFICATIONS */}
        {data.certifications && data.certifications.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Certifications
            </Text>
            {data.certifications.map((cert, i) => (
              <View key={i} style={styles.block}>
                <View style={styles.itemRow}>
                  <Text
                    style={[
                      styles.normalText,
                      styles.boldText,
                      dynamicStyles.text,
                    ]}
                  >
                    {cert.title}
                  </Text>
                  <Text style={[styles.normalText, dynamicStyles.text]}>
                    {cert.date}
                  </Text>
                </View>
                <Text style={[styles.normalText, dynamicStyles.text]}>
                  {cert.issuer} {cert.link ? ` | ` : ""}
                  {cert.link && (
                    <Link
                      src={cert.link}
                      style={[styles.link, dynamicStyles.text]}
                    >
                      View Credential
                    </Link>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* LANGUAGES */}
        {data.languages && data.languages.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionHeading]}>
              Languages
            </Text>
            <Text style={[styles.normalText, dynamicStyles.text]}>
              {Array.isArray(data.languages)
                ? data.languages.join(" • ")
                : data.languages}
            </Text>
          </View>
        )}

        {/* CUSTOM SECTIONS */}
        {data.customSections && data.customSections.length > 0 && (
          <View>
            {data.customSections.map((custom, i) => (
              <View key={i} style={{ marginTop: i > 0 ? 10 : 0 }}>
                {custom.sectionTitle && (
                  <Text
                    style={[styles.sectionTitle, dynamicStyles.sectionHeading]}
                  >
                    {custom.sectionTitle}
                  </Text>
                )}
                <View style={styles.block}>
                  <View style={styles.itemRow}>
                    <Text
                      style={[
                        styles.normalText,
                        styles.boldText,
                        dynamicStyles.text,
                      ]}
                    >
                      {custom.title}
                    </Text>
                    <Text style={[styles.normalText, dynamicStyles.text]}>
                      {custom.startDate}{" "}
                      {custom.endDate ? `- ${custom.endDate}` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.normalText, dynamicStyles.text]}>
                    {custom.location}
                  </Text>
                  {custom.description && (
                    <Text
                      style={[
                        styles.normalText,
                        dynamicStyles.text,
                        { marginTop: 4 },
                      ]}
                    >
                      {custom.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumePDF;
