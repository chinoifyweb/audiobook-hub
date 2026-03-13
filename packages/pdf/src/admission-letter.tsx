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
    paddingTop: 50,
    paddingBottom: 80,
  },
  letterhead: {
    textAlign: "center",
    marginBottom: 30,
  },
  institutionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: colors.navyBlue,
    letterSpacing: 2,
  },
  motto: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 10,
    color: colors.gold,
    marginTop: 4,
  },
  address: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.mediumGray,
    marginTop: 6,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: colors.navyBlue,
    marginTop: 12,
    marginBottom: 8,
  },
  dividerThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gold,
    marginBottom: 20,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  refText: {
    fontSize: 10,
    color: colors.mediumGray,
  },
  dateText: {
    fontSize: 10,
    color: colors.darkGray,
  },
  recipientBlock: {
    marginBottom: 20,
  },
  recipientName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.darkGray,
  },
  recipientAddress: {
    fontSize: 10,
    color: colors.darkGray,
    marginTop: 2,
  },
  subject: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.navyBlue,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 20,
  },
  salutation: {
    fontSize: 11,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: "justify",
  },
  conditionsTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.navyBlue,
    marginTop: 16,
    marginBottom: 8,
  },
  conditionItem: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
    paddingLeft: 16,
  },
  conditionNumber: {
    fontFamily: "Helvetica-Bold",
    color: colors.navyBlue,
  },
  signatureBlock: {
    marginTop: 40,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
    width: 200,
    marginBottom: 4,
  },
  signatureName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.darkGray,
  },
  signatureTitle: {
    fontSize: 10,
    color: colors.mediumGray,
  },
});

export interface AdmissionLetterData {
  studentName: string;
  applicationNumber: string;
  programName: string;
  degreeType: string;
  departmentName: string;
  facultyName: string;
  sessionName: string;
  admissionDate: string;
  address?: string;
  email: string;
}

export function AdmissionLetterPDF({ data }: { data: AdmissionLetterData }) {
  const conditions = [
    "You must complete registration within two (2) weeks of resumption.",
    "All tuition and fees must be paid in full before the commencement of lectures.",
    "You must present original copies of all academic credentials for verification.",
    "You are expected to abide by all rules and regulations of the Academy as contained in the Student Handbook.",
    "This admission is valid only for the academic session stated above. Deferment requests must be submitted in writing to the Registrar.",
    "The Academy reserves the right to withdraw this offer if any information provided is found to be false or misleading.",
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          <Text style={styles.institutionName}>BEREAN BIBLE ACADEMY</Text>
          <Text style={styles.motto}>
            &quot;Training Leaders for Kingdom Impact&quot;
          </Text>
          <Text style={styles.address}>
            P.O. Box 1234, Lagos, Nigeria | admissions@bba.edu.ng |
            www.bba.edu.ng
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dividerThin} />

        {/* Reference and Date */}
        <View style={styles.refRow}>
          <Text style={styles.refText}>
            Ref: BBA/ADM/{data.applicationNumber}
          </Text>
          <Text style={styles.dateText}>{data.admissionDate}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>{data.studentName}</Text>
          {data.address && (
            <Text style={styles.recipientAddress}>{data.address}</Text>
          )}
          <Text style={styles.recipientAddress}>{data.email}</Text>
        </View>

        {/* Subject */}
        <Text style={styles.subject}>
          OFFER OF ADMISSION &mdash; {data.sessionName} ACADEMIC SESSION
        </Text>

        {/* Salutation */}
        <Text style={styles.salutation}>Dear {data.studentName},</Text>

        {/* Body */}
        <Text style={styles.paragraph}>
          I am pleased to inform you that, following a careful review of your
          application, the Academic Board of Berean Bible Academy has approved
          your admission into the following programme:
        </Text>

        <View style={{ marginLeft: 20, marginBottom: 12 }}>
          <View style={commonStyles.row}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, width: 140 }}>
              Programme:
            </Text>
            <Text style={{ fontSize: 11 }}>{data.programName}</Text>
          </View>
          <View style={commonStyles.row}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, width: 140 }}>
              Degree:
            </Text>
            <Text style={{ fontSize: 11 }}>
              {data.degreeType.charAt(0).toUpperCase() + data.degreeType.slice(1)}
            </Text>
          </View>
          <View style={commonStyles.row}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, width: 140 }}>
              Department:
            </Text>
            <Text style={{ fontSize: 11 }}>{data.departmentName}</Text>
          </View>
          <View style={commonStyles.row}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, width: 140 }}>
              Faculty:
            </Text>
            <Text style={{ fontSize: 11 }}>{data.facultyName}</Text>
          </View>
          <View style={commonStyles.row}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, width: 140 }}>
              Academic Session:
            </Text>
            <Text style={{ fontSize: 11 }}>{data.sessionName}</Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          We congratulate you on this achievement and look forward to welcoming
          you to our community of scholars and leaders. Your admission is,
          however, subject to the following conditions:
        </Text>

        {/* Conditions */}
        <Text style={styles.conditionsTitle}>Conditions of Admission:</Text>
        {conditions.map((condition, index) => (
          <Text key={index} style={styles.conditionItem}>
            <Text style={styles.conditionNumber}>{index + 1}. </Text>
            {condition}
          </Text>
        ))}

        <Text style={[styles.paragraph, { marginTop: 16 }]}>
          Please confirm your acceptance of this offer by completing the
          registration process on the Student Portal. We wish you a fulfilling
          and transformative academic journey at Berean Bible Academy.
        </Text>

        <Text style={styles.paragraph}>Yours faithfully,</Text>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>The Registrar</Text>
          <Text style={styles.signatureTitle}>Berean Bible Academy</Text>
        </View>

        {/* Footer */}
        <Text style={commonStyles.footer}>
          Berean Bible Academy | Raising Godly Leaders | This is an
          electronically generated document.
        </Text>
      </Page>
    </Document>
  );
}
