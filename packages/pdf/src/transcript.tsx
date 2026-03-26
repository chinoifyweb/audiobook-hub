import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { colors, commonStyles } from "./styles";

const styles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    paddingTop: 40,
    paddingBottom: 70,
    fontSize: 9,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  institutionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: colors.navyBlue,
    letterSpacing: 2,
  },
  documentTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: colors.navyBlue,
    marginTop: 6,
    textDecoration: "underline",
  },
  motto: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8,
    color: colors.gold,
    marginTop: 3,
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: colors.navyBlue,
    marginTop: 10,
    marginBottom: 4,
  },
  headerDividerThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gold,
    marginBottom: 16,
  },
  studentInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 4,
    padding: 10,
    backgroundColor: colors.lightGray,
  },
  studentInfoItem: {
    width: "50%",
    marginBottom: 6,
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: colors.mediumGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 9,
    color: colors.darkGray,
    marginTop: 1,
  },
  semesterHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.navyBlue,
    backgroundColor: colors.lightGray,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.navyBlue,
    borderBottomWidth: 0,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.navyBlue,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: colors.white,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderGray,
  },
  tableRowAlt: {
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    fontSize: 8,
    color: colors.darkGray,
  },
  // Column widths
  colCode: { width: "15%" },
  colTitle: { width: "35%" },
  colCredits: { width: "12%", textAlign: "center" },
  colGrade: { width: "12%", textAlign: "center" },
  colPoints: { width: "13%", textAlign: "center" },
  colWeighted: { width: "13%", textAlign: "center" },
  semesterSummary: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderTopWidth: 0,
    marginBottom: 4,
  },
  summaryItem: {
    marginLeft: 20,
    flexDirection: "row",
  },
  summaryLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.navyBlue,
  },
  summaryValue: {
    fontSize: 8,
    color: colors.darkGray,
    marginLeft: 4,
  },
  cumulativeSection: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: colors.navyBlue,
    borderRadius: 4,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.lightGray,
  },
  cumulativeItem: {
    alignItems: "center",
  },
  cumulativeLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.mediumGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cumulativeValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: colors.navyBlue,
    marginTop: 2,
  },
  gradingScale: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 4,
    padding: 8,
  },
  gradingScaleTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.navyBlue,
    marginBottom: 4,
  },
  gradingScaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  gradingScaleText: {
    fontSize: 7,
    color: colors.darkGray,
  },
  watermark: commonStyles.watermark,
  footer: {
    ...commonStyles.footer,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stampSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stampBlock: {
    alignItems: "center",
  },
  stampLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
    width: 150,
    marginBottom: 3,
  },
  stampLabel: {
    fontSize: 7,
    color: colors.mediumGray,
  },
});

export interface TranscriptGrade {
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  letterGrade: string;
  gradePoint: number;
}

export interface TranscriptSemester {
  sessionName: string;
  semesterName: string;
  grades: TranscriptGrade[];
  totalCredits: number;
  totalWeightedPoints: number;
  gpa: number;
}

export interface TranscriptData {
  studentName: string;
  studentId: string;
  programName: string;
  degreeType: string;
  departmentName: string;
  facultyName: string;
  enrollmentDate: string;
  status: string;
  semesters: TranscriptSemester[];
  cumulativeCredits: number;
  cumulativeGPA: number;
  generatedDate: string;
}

export function TranscriptPDF({ data }: { data: TranscriptData }) {
  const gradingScale = [
    { range: "70 - 100", grade: "A", points: "5.00", desc: "Excellent" },
    { range: "60 - 69", grade: "B", points: "4.00", desc: "Very Good" },
    { range: "50 - 59", grade: "C", points: "3.00", desc: "Good" },
    { range: "45 - 49", grade: "D", points: "2.00", desc: "Fair" },
    { range: "40 - 44", grade: "E", points: "1.00", desc: "Pass" },
    { range: "0 - 39", grade: "F", points: "0.00", desc: "Fail" },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>BEREAN BIBLE ACADEMY</Text>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>BEREAN BIBLE ACADEMY</Text>
          <Text style={styles.motto}>
            Training Leaders for Kingdom Impact
          </Text>
          <Text style={styles.documentTitle}>ACADEMIC TRANSCRIPT</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerDividerThin} />

        {/* Student Info */}
        <View style={styles.studentInfoGrid}>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{data.studentName}</Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Student ID</Text>
            <Text style={styles.infoValue}>{data.studentId}</Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Programme</Text>
            <Text style={styles.infoValue}>{data.programName}</Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Degree</Text>
            <Text style={styles.infoValue}>
              {data.degreeType.charAt(0).toUpperCase() + data.degreeType.slice(1)}
            </Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{data.departmentName}</Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Faculty</Text>
            <Text style={styles.infoValue}>{data.facultyName}</Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Date of Enrollment</Text>
            <Text style={styles.infoValue}>{data.enrollmentDate}</Text>
          </View>
          <View style={styles.studentInfoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Semester by Semester Grades */}
        {data.semesters.map((semester, sIdx) => (
          <View key={sIdx} wrap={false}>
            <Text style={styles.semesterHeader}>
              {semester.sessionName} &mdash; {semester.semesterName}
            </Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colCode]}>
                Code
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTitle]}>
                Course Title
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colCredits]}>
                Credits
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colGrade]}>
                Grade
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colPoints]}>
                Points
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colWeighted]}>
                Weighted
              </Text>
            </View>

            {/* Table Rows */}
            {semester.grades.map((grade, gIdx) => (
              <View
                key={gIdx}
                style={[
                  styles.tableRow,
                  gIdx % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.colCode]}>
                  {grade.courseCode}
                </Text>
                <Text style={[styles.tableCell, styles.colTitle]}>
                  {grade.courseTitle}
                </Text>
                <Text style={[styles.tableCell, styles.colCredits]}>
                  {grade.creditUnits}
                </Text>
                <Text style={[styles.tableCell, styles.colGrade]}>
                  {grade.letterGrade}
                </Text>
                <Text style={[styles.tableCell, styles.colPoints]}>
                  {grade.gradePoint.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.colWeighted]}>
                  {(grade.creditUnits * grade.gradePoint).toFixed(2)}
                </Text>
              </View>
            ))}

            {/* Semester Summary */}
            <View style={styles.semesterSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Credits:</Text>
                <Text style={styles.summaryValue}>
                  {semester.totalCredits}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Weighted Points:</Text>
                <Text style={styles.summaryValue}>
                  {semester.totalWeightedPoints.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>GPA:</Text>
                <Text style={styles.summaryValue}>
                  {semester.gpa.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Cumulative Summary */}
        <View style={styles.cumulativeSection}>
          <View style={styles.cumulativeItem}>
            <Text style={styles.cumulativeLabel}>Total Credits Earned</Text>
            <Text style={styles.cumulativeValue}>
              {data.cumulativeCredits}
            </Text>
          </View>
          <View style={styles.cumulativeItem}>
            <Text style={styles.cumulativeLabel}>Cumulative GPA</Text>
            <Text style={styles.cumulativeValue}>
              {data.cumulativeGPA.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Grading Scale */}
        <View style={styles.gradingScale}>
          <Text style={styles.gradingScaleTitle}>Grading Scale</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {gradingScale.map((item, i) => (
              <View
                key={i}
                style={{
                  width: "33%",
                  flexDirection: "row",
                  paddingVertical: 1,
                }}
              >
                <Text style={styles.gradingScaleText}>
                  {item.grade} ({item.range}) = {item.points} &mdash;{" "}
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Signature / Stamp area */}
        <View style={styles.stampSection}>
          <View style={styles.stampBlock}>
            <View style={styles.stampLine} />
            <Text style={styles.stampLabel}>Registrar</Text>
          </View>
          <View style={styles.stampBlock}>
            <View style={styles.stampLine} />
            <Text style={styles.stampLabel}>Date: {data.generatedDate}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={commonStyles.footer}>
          This transcript is electronically generated by Berean Bible Academy.
          Verify at www.bba.edu.ng/verify | Generated: {data.generatedDate}
        </Text>
      </Page>
    </Document>
  );
}
