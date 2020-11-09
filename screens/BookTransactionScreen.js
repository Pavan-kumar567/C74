import * as React from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity,Image,KeyboardAvoidingView} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';


export default class TransactionScreen extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedStudentId: '',
            scannedBookId: '',
            buttonState: 'normal',
            transactionMessage: ''
        }
    }
    getCameraPermissions = async(id)=>{
        const {status}= await Permissions.askAsync(Permissions.CAMERA);

        this.setState({
            /*
            status === "granted" is true when the user has granted permission.
            status === "granted" is false when the user hasn't granted permission.
            */
            hasCameraPermissions: status === "granted",
            buttonState: id,
            scanned: false

        })
    }
    handleBarCodeScanned = async({type,data})=>{
        const {buttonState}= this.state

        if(buttonState === "BookId"){
            this.setState({
                scanned: true,
                scannedBookId: data,
                buttonState: 'normal'
            })
        }
        else if(buttonState === "StudentId"){
            this.setState({
                scanned: true,
                scannedStudentId: data,
                buttonState: 'normal'
            })
        }
    }

    initiateBookIssue(){
        //add a transaction
        db.collection("transactions").add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Issue"
        })

        //change book statue
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability': false 
        })
        //change the number of books issued by the student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued': firebase.firestore.FieldValue.increment(1)
        })
    }
    initiateBookReturn(){
        //add a transaction
        db.collection("transactions").add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Return"
        })

        //change book statue
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability': true 
        })
        //change the number of books issued by the student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
        })
    }

    checkBookEligiblity = async()=>{
        const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
        var transactionType = ""
        if(bookRef.docs.length === 0){
            transactionType = false;
            alert("The Book Dosen't Exsist In Our Library")
        }
        else{
            bookRef.docs.map((doc)=>{
                var book = doc.data()
                if(book.bookAvailability){
                    transactionType = "Issue"
                }
                else{
                    transactionType = "Return"
                }
            })
        }
        return transactionType
    }
    checkStudentEligibilityForBookIssue = async()=>{
        const studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligible = ""
        if(studentRef.docs.length === 0){
            isStudentEligible = false;
            alert("The Student Id Dosen't Exsist In Our Data Base")
            this.setState({
                scannedBookId: '',
                scannedStudentId: '' 
            })
        }
        else{
            studentRef.docs.map((doc)=>{
                var student = doc.data()
                if(student.numberOfBooksIssued<2){
                    isStudentEligible = true;
                }
                else{
                    isStudentEligible = false;
                    alert("The Student Has Already Issued 2 Books");
                    this.setState({
                        scannedBookId: '',
                        scannedStudentId: '' 
                    })
                }
            })
        }
        return isStudentEligible
    }

    checkStudentEligibilityForBookReturn = async()=>{
        const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
        var isStudentEligible = ""
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentId === this.state.scannedStudentId){
                isStudentEligible = true;
            }
            else{
                isStudentEligible = false;
                    alert("The Book Wasn't Issued by This Student");
                    this.setState({
                        scannedBookId: '',
                        scannedStudentId: '' 
                    })
            }
        })
        return isStudentEligible
    }




    handletransaction = async()=>{
        //Verify if the student is eligible or book issue or return or none
        var transactionType = await this.checkBookEligiblity();
        if(!transactionType){
            alert("The Book Dosent Exsist In Librery Database")
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
        }
        else if (transactionType === "Issue"){
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
            if(isStudentEligible){
                this.initiateBookIssue()
                alert("Book Issued To The Student")
            }
        }
        else{
            var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
            if(isStudentEligible){
                this.initiateBookReturn()
                alert("Book Returned To The Library")
            }
        }
    }
    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState = this.state.buttonState;
        
        if(buttonState !== "normal" && hasCameraPermissions){
            return(
             <BarCodeScanner
             onBarCodeScanned = {scanned?undefined:this.handleBarCodeScanned}
             style = {StyleSheet.absoluteFillObject}/>
            )
        }
        else if(buttonState === "normal"){
            return(
                <KeyboardAvoidingView style = {styles.container} behavior = "padding" enabled>
                    <View>
                    <Image
                        source = {require("../assets/booklogo.jpg")}
                            style = {{width: 200, height: 200}}
                        />
                        <Text style = {{textAlign: 'center', fontSize: 30}}>
                            WILY
                        </Text>
                    </View>

                    <View style = {styles.inputView}>
                    <TextInput 

                        style = {styles.inputBox}
                        placeholder = "Book Id"
                        onChangeText = {text=>this.setState({scannedBookId: text})}
                        value = {this.state.scannedBookId}
                    />
                    <TouchableOpacity style = {styles.scannedButton}

                        onPress = {()=>{
                            this.getCameraPermissions("BookId")
                        }}
                    >
                        <Text style = {styles.buttonText}>Scan</Text>

                    </TouchableOpacity>

                    </View>
                    <View style = {styles.inputView}>
                    <TextInput 

                        style = {styles.inputBox}
                        placeholder = "Student Id"
                        onChangeText = {text=>this.setState({scannedStudentId: text})}
                        value = {this.state.scannedStudentId}
                    />
                    <TouchableOpacity style = {styles.scannedButton}

                        onPress = {()=>{
                            this.getCameraPermissions("StudentId")
                        }}
                    >
                        <Text style = {styles.buttonText}>Scan</Text>

                    </TouchableOpacity>

                    </View>

                    <TouchableOpacity style={styles.submitButton}
                        onPress = {async()=>{
                            var transactionMessage = await this.handletransaction();
                        }}
                    >
                        <Text style = {styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>

                
                </KeyboardAvoidingView>
            )
        }
    }
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    displayText:{
        fontSize:15,
        textDecorationLine: 'underline'
    },
    scanButton:{
        backgroundColor: '#2196f3',
        padding:10,
        margin: 10
    },
    buttonText:{
        fontSize: 15,
        textAlign: 'center',
        marginTop: '10'
    },
    inputView: {
        flexDirection: 'row',
        margin: 20
    },
    inputBox: {
        width: 200,
        height: 40,
        borderWidth: 1.5,
        borderRightWidth: 0,
        fontSize: 20        
    },
    scannedButton:{
        backgroundColor: '#663d6a',
        width: 50,
        borderWidth: 1.5,
        borderLeftWidth: 0
    },
    submitButton:{
        backgroundColor: '#fbc02d',
        width: 100,
        height: 50
    },
    submitButtonText:{
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff'
    }


})