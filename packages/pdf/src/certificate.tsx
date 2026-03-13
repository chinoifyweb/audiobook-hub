import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { colors } from "./styles";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 0,
    backgroundColor: colors.white,
  },
  outerBorder: {
    margin: 30,
    borderWidth: 3,
    borderColor: colors.navyBlue,
    padding: 6,
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 40,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  institutionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: colors.navyBlue,
    letterSpacing: 3,
  },
  motto: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 10,
    color: colors.gold,
    marginTop: 6,
    letterSpacing: 1,
  },
  ornamentalLine: {
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
    width: 200,
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  ornamentalLineThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.navyBlue,
    width: 160,
    alignSelf: "center",
    marginBottom: 24,
  },
  certifiesText: {
    textAlign: "center",
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 8,
  },
  thisIsTo: {
    textAlign: "center",
    fontFamily: "Helvetica-Oblique",
    fontSize: 11,
    color: colors.mediumGray,
    marginBottom: 6,
  },
  studentName: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    color: colors.navyBlue,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
    marginHorizontal: 40,
  },
  bodyText: {
    textAlign: "center",
    fontSize: 12,
    color: colors.darkGray,
    lineHeight: 1.8,
    marginTop: 12,
  },
  degreeName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: colors.navyBlue,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  programName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: colors.darkGray,
    textAlign: "center",
    marginBottom: 12,
  },
  dateText: {
    textAlign: "center",
    fontSize: 11,
    color: colors.darkGray,
    marginTop: 8,
  },
  certNumber: {
    textAlign: "center",
    fontSize: 8,
    color: colors.mediumGray,
    marginTop: 16,
    letterSpacing: 1,
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  signatureBlock: {
    alignItems: "center",
    width: "40%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
    width: "100%",
    marginBottom: 4,
  },
  signatureTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.darkGray,
  },
  signatureSubtitle: {
    fontSize: 8,
    color: colors.mediumGray,
    marginTop: 1,
  },
  qrSection: {
    alignItems: "center",
    marginTop: 20,
  },
  qrBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderGray,
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholder: {
    fontSize: 5,
    color: colors.mediumGray,
    textAlign: "center",
  },
  verifyText: {
    fontSize: 6,
    color: colors.mediumGray,
    marginTop: 3,
  },
});

export interface CertificateData {
  studentName: string;
  programName: string;
  degreeType: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  facultyName: string;
  departmentName: string;
}

function formatDegreeTitle(degreeType: string): string {
  const map: Record<string, string> = {
    certificate: "Certificate",
    diploma: "Diploma",
    bachelors: "Bachelor of Arts",
    masters: "Master of Arts",
    phd: "Doctor of Philosophy",
  };
  return map[degreeType] || degreeType;
}

export function CertificatePDF({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.institutionName}>
                BEREAN BIBLE ACADEMY
              </Text>
              <Text style={styles.motto}>
                Training Leaders for Kingdom Impact
              </Text>
            </View>

            <View style={styles.ornamentalLine} />
            <View style={styles.ornamentalLineThin} />

            {/* Body */}
            <Text style={styles.thisIsTo}>This is to certify that</Text>

            <Text style={styles.studentName}>{data.studentName}</Text>

            <Text style={styles.bodyText}>
              having satisfied the requirements prescribed by the Academic Board
              of Berean Bible Academy, is hereby awarded the degree of
            </Text>

            <Text style={styles.degreeName}>
              {formatDegreeTitle(data.degreeType)}
            </Text>

            <Text style={styles.programName}>in {data.programName}</Text>

            <Text style={styles.dateText}>
              Given under the seal of the Academy on this day,{" "}
              {data.issueDate}
            </Text>

            <Text style={styles.certNumber}>
              Certificate No: {data.certificateNumber}
            </Text>

            {/* Signatures */}
            <View style={styles.signaturesRow}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Rector</Text>
                <Text style={styles.signatureSubtitle}>
                  Berean Bible Academy
                </Text>
              </View>

              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Registrar</Text>
                <Text style={styles.signatureSubtitle}>
                  Berean Bible Academy
                </Text>
              </View>
            </View>

            {/* QR Verification */}
            <View style={styles.qrSection}>
              <View style={styles.qrBox}>
                <Text style={styles.qrPlaceholder}>
                  QR CODE{"\n"}Verification
                </Text>
              </View>
              <Text style={styles.verifyText}>
                Verify: www.bba.edu.ng/verify/{data.verificationCode}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
