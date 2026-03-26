import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { colors } from "./styles";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 0,
    backgroundColor: colors.white,
  },
  card: {
    width: 340,
    height: 215,
    margin: "auto",
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.navyBlue,
    borderRadius: 8,
    overflow: "hidden",
  },
  // Front of card
  frontHeader: {
    backgroundColor: colors.navyBlue,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  frontHeaderLeft: {
    flexDirection: "column",
  },
  institutionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.white,
    letterSpacing: 1,
  },
  institutionSubtitle: {
    fontSize: 6,
    color: colors.gold,
    marginTop: 2,
  },
  idBadge: {
    backgroundColor: colors.gold,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  idBadgeText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: colors.navyBlue,
  },
  frontBody: {
    flexDirection: "row",
    padding: 12,
    flex: 1,
  },
  photoContainer: {
    width: 75,
    height: 90,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  photoPlaceholder: {
    fontSize: 8,
    color: colors.mediumGray,
    textAlign: "center",
  },
  photo: {
    width: 75,
    height: 90,
    objectFit: "cover",
  },
  infoSection: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 6,
    color: colors.mediumGray,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 9,
    color: colors.darkGray,
    marginBottom: 6,
  },
  studentIdValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.navyBlue,
    marginBottom: 6,
  },
  frontFooter: {
    backgroundColor: colors.navyBlue,
    paddingVertical: 5,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validityText: {
    fontSize: 6,
    color: colors.white,
  },
  // Back of card
  backCard: {
    width: 340,
    height: 215,
    margin: "auto",
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.navyBlue,
    borderRadius: 8,
    overflow: "hidden",
  },
  backHeader: {
    backgroundColor: colors.navyBlue,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  backHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.white,
    letterSpacing: 1,
  },
  backBody: {
    padding: 12,
    flex: 1,
  },
  backText: {
    fontSize: 7,
    color: colors.darkGray,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  qrContainer: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: colors.borderGray,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  qrPlaceholder: {
    fontSize: 6,
    color: colors.mediumGray,
    textAlign: "center",
  },
  backFooter: {
    backgroundColor: colors.navyBlue,
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  backFooterText: {
    fontSize: 6,
    color: colors.gold,
  },
});

export interface StudentIdCardData {
  studentName: string;
  studentId: string; // format: BBA/STU/YYYY/NNNN
  programName: string;
  departmentName: string;
  facultyName: string;
  enrollmentDate: string;
  expectedGraduation?: string;
  photoUrl?: string;
  bloodGroup?: string;
}

export function StudentIdCardPDF({ data }: { data: StudentIdCardData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Front of Card */}
        <View style={styles.card}>
          <View style={styles.frontHeader}>
            <View style={styles.frontHeaderLeft}>
              <Text style={styles.institutionName}>BEREAN BIBLE ACADEMY</Text>
              <Text style={styles.institutionSubtitle}>
                Training Leaders for Kingdom Impact
              </Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>STUDENT ID</Text>
            </View>
          </View>

          <View style={styles.frontBody}>
            <View style={styles.photoContainer}>
              {data.photoUrl ? (
                <Image src={data.photoUrl} style={styles.photo} />
              ) : (
                <Text style={styles.photoPlaceholder}>STUDENT{"\n"}PHOTO</Text>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.studentIdValue}>{data.studentId}</Text>

              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{data.studentName}</Text>

              <Text style={styles.infoLabel}>Programme</Text>
              <Text style={styles.infoValue}>{data.programName}</Text>

              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{data.departmentName}</Text>
            </View>
          </View>

          <View style={styles.frontFooter}>
            <Text style={styles.validityText}>
              Enrolled: {data.enrollmentDate}
            </Text>
            {data.expectedGraduation && (
              <Text style={styles.validityText}>
                Expected Graduation: {data.expectedGraduation}
              </Text>
            )}
          </View>
        </View>

        {/* Back of Card */}
        <View style={styles.backCard}>
          <View style={styles.backHeader}>
            <Text style={styles.backHeaderText}>
              BEREAN BIBLE ACADEMY &mdash; IDENTIFICATION CARD
            </Text>
          </View>

          <View style={styles.backBody}>
            <Text style={styles.backText}>
              This card certifies that the bearer is a bona fide student of
              Berean Bible Academy. This card remains the property of the Academy
              and must be returned upon request or upon completion/withdrawal
              from the programme.
            </Text>
            <Text style={styles.backText}>
              If found, please return to:{"\n"}
              Berean Bible Academy, Student Affairs Office{"\n"}
              P.O. Box 1234, Lagos, Nigeria
            </Text>

            <View style={styles.qrContainer}>
              <Text style={styles.qrPlaceholder}>QR CODE{"\n"}Verification</Text>
            </View>
          </View>

          <View style={styles.backFooter}>
            <Text style={styles.backFooterText}>
              www.bba.edu.ng | student.affairs@bba.edu.ng
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
