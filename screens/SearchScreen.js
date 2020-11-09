import * as React from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity,Image,FlatList} from 'react-native';
import db from '../config';
import { ScrollView } from 'react-native-gesture-handler';

export default class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.setState = {
            allTransactions: [],
            lastVisibleTransaction: null,
            search: ''
        }
    }
    fetchMoreTransactions = async()=>{
        var text = this.state.search.toUpperCase()
        var enteredText = text.split("")
        
        if(enteredText[0].toUpperCase()==='B'){
            const query = await db.collection("transactions").where('bookId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
            query.docs.map((doc)=>{
                this.setState({
                allTransactions: [...this.state.allTransactions,doc.data()],
                lastVisibleTransaction: doc
                })
            })
        }
        else if(enteredText[0].toUpperCase()==='S'){
            const query = await db.collection("transactions").where('sutdentId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
            query.docs.map((doc)=>{
                this.setState({
                allTransactions: [...this.state.allTransactions,doc.data()],
                lastVisibleTransaction: doc
                })
            })
        }
    }
    searchTransactions = async(text)=>{
        var enteredText = text.split("")

        if(enteredText[0].toUpperCase()==='B'){
            const query = await db.collection("transactions").where('bookId','==',text).get()
            query.docs.map((doc)=>{
                this.setState({
                allTransactions: [...this.state.allTransactions,doc.data()],
                lastVisibleTransaction: doc
                })
            })
        }
        else if(enteredText[0].toUpperCase()==='S'){
            const query = await db.collection("transactions").where('sutdentId','==',text).get()
            query.docs.map((doc)=>{
                this.setState({
                allTransactions: [...this.state.allTransactions,doc.data()],
                lastVisibleTransaction: doc
                })
            })
        }
    }
    componentDidMount = async()=>{
        const query = await db.collection("transactions").limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions: [],
                lastVisibleTransaction : doc
            })
        })
    }
    render(){
        return(
            <View style = {styles.container}>
                <View style = {styles.searchBar}>
                    <TextInput 
                    style = {styles.bar}
                    placeholder = "Enter Book Id Or Student Id"
                    onChangeText = {(text)=>{this.setState({search: text})}}/>
                    <TouchableOpacity
                    style = {styles.searchButton}
                    onPress = {()=>{this.searchTransactions(this.state.search)}}
                    >
                        <Text>Search</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                data = {this.state.allTransactions}
                renderItem = {({item})=>(
                    <View style = {{borderBottomWidth: 2}}>
                        <Text>{"book id : " + item.bookId}</Text>
                        <Text>{"student id : " + item.studentId}</Text>
                        <Text>{"transaction type : " + item.transactionType}</Text>
                        </View>
                
                )}
                keyExtractor = {(item,index)=>index.toString()}
                onEndReached = {this.fetchMoreTransactions}
                onEndReachedThreshold = {0.7}
                />
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20
    },
    searchBar:{
        flexDirection: 'row',
        height: 40,
        width: 'auto',
        borderWidth: 0.5,
        alignItems: 'center',
        backgroundColor: 'grey'       
    },
    bar:{
        borderWidth: 2,
        heignt: 30,
        width: 300,
        paddingLeft: 10
    },
    searchButton:{
        borderWidth: 1,
        height: 30,
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'green'
    }
}) 

